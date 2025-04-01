import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    // 2. Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'absence', 'leave', ou null pour tous les types
    const status = searchParams.get("status"); // 'PENDING', 'APPROVED', 'REJECTED', ou null pour tous les statuts
    
    // Récupérer les paramètres de pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // 3. Récupérer les demandes d'absence
    const absenceRequests = await prisma.absenceRequest.findMany({
      where: {
        userId: user.id,
        ...(status ? { status: status as any } : {})
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // 4. Récupérer les demandes de congés avec leurs périodes
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
        ...(status ? { status: status as any } : {})
      },
      include: {
        leavePeriods: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // 5. Préparer les données selon le type demandé
    let data;
    
    if (type === "absence") {
      data = absenceRequests.map(request => {
        // Calculer le nombre de jours selon la période
        let dayCount = 0;
        switch(request.period) {
          case "MORNING":
          case "AFTERNOON":
            dayCount = 0.5;
            break;
          case "FULL_DAY":
            dayCount = 1;
            break;
          case "CUSTOM":
            // Pour les horaires personnalisés, on estime la durée
            dayCount = 1; // Valeur par défaut
            break;
        }

        return {
        id: request.id,
        type: "absence",
          startDate: request.absenceDate,
          endDate: request.absenceDate,
          dayCount,
          period: request.period,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        comment: request.userComment
        };
      });
    } else if (type === "leave") {
      data = leaveRequests.map(request => ({
        id: request.id,
        type: "leave",
        periods: request.leavePeriods.map(period => ({
          id: period.id,
          startDate: period.startDate,
          endDate: period.endDate,
          dayCount: period.dayCount
        })),
        totalDays: request.leavePeriods.reduce((sum, period) => sum + period.dayCount, 0),
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        comment: request.userComment
      }));
    } else {
      // Combiner les deux types de demandes
      const absenceData = absenceRequests.map(request => {
        // Calculer le nombre de jours selon la période
        let dayCount = 0;
        switch(request.period) {
          case "MORNING":
          case "AFTERNOON":
            dayCount = 0.5;
            break;
          case "FULL_DAY":
            dayCount = 1;
            break;
          case "CUSTOM":
            // Pour les horaires personnalisés, on estime la durée
            dayCount = 1; // Valeur par défaut
            break;
        }

        return {
        id: request.id,
        type: "absence",
          startDate: request.absenceDate,
          endDate: request.absenceDate,
          dayCount,
          period: request.period,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        comment: request.userComment
        };
      });

      const leaveData = leaveRequests.map(request => ({
        id: request.id,
        type: "leave",
        periods: request.leavePeriods.map(period => ({
          id: period.id,
          startDate: period.startDate,
          endDate: period.endDate,
          dayCount: period.dayCount
        })),
        // Pour faciliter l'affichage, on ajoute aussi les dates de début et de fin
        startDate: request.leavePeriods.length > 0 ? 
          request.leavePeriods.reduce((earliest, period) => 
            new Date(period.startDate) < new Date(earliest) ? period.startDate : earliest, 
            request.leavePeriods[0].startDate) : null,
        endDate: request.leavePeriods.length > 0 ? 
          request.leavePeriods.reduce((latest, period) => 
            new Date(period.endDate) > new Date(latest) ? period.endDate : latest, 
            request.leavePeriods[0].endDate) : null,
        totalDays: request.leavePeriods.reduce((sum, period) => sum + period.dayCount, 0),
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        comment: request.userComment
      }));

      // Trier toutes les demandes par date de création
      data = [...absenceData, ...leaveData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Appliquer la pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit);

    // 6. Renvoyer les demandes avec la pagination
    return NextResponse.json({ 
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        message: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 