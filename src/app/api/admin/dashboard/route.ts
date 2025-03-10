import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export async function GET() {
  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Récupérer tous les check-ins
    const checkIns = await prisma.checkIn.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Récupérer toutes les pauses
    const pauses = await prisma.pause.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Récupérer tous les check-outs
    const checkOuts = await prisma.checkout.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Calculer les statistiques
    const totalUsers = users.length;
    const totalCheckIns = checkIns.length;
    const totalPauses = pauses.length;
    const totalCheckOuts = checkOuts.length;

    // Calculer les activités de la semaine courante
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Lundi
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Dimanche

    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyActivity = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const formattedDay = format(day, 'EEE', { locale: fr });
      
      return {
        day: formattedDay,
        date: dayStr,
        checkIns: checkIns.filter(ci => 
          isWithinInterval(new Date(ci.timestamp), { 
            start: new Date(day.setHours(0,0,0,0)), 
            end: new Date(day.setHours(23,59,59,999)) 
          })
        ).length,
        pauses: pauses.filter(p => 
          isWithinInterval(new Date(p.timestamp), { 
            start: new Date(day.setHours(0,0,0,0)), 
            end: new Date(day.setHours(23,59,59,999)) 
          })
        ).length,
        checkOuts: checkOuts.filter(co => 
          isWithinInterval(new Date(co.timestamp), { 
            start: new Date(day.setHours(0,0,0,0)), 
            end: new Date(day.setHours(23,59,59,999)) 
          })
        ).length
      };
    });

    // Calculer le temps de travail moyen par jour
    const checkouts = await prisma.checkout.findMany({
      include: {
        user: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Structure pour stocker les données de temps de travail par jour
    interface WorkTimeData {
      totalHours: number;
      count: number;
      average?: number;
    }
    
    const averageWorkTimeByDay: Record<string, WorkTimeData> = {};

    // Pour chaque checkout, trouver le checkin correspondant
    for (const checkout of checkouts) {
      const checkoutTime = new Date(checkout.timestamp);
      const dateKey = format(checkoutTime, 'yyyy-MM-dd');
      
      // Trouver le check-in correspondant pour le même utilisateur le même jour
      const checkIn = await prisma.checkIn.findFirst({
        where: {
          userId: checkout.userId,
          timestamp: {
            gte: startOfDay(checkoutTime),
            lte: endOfDay(checkoutTime),
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
      
      if (checkIn) {
        const checkInDate = new Date(checkIn.timestamp);
        const workDuration = (checkoutTime.getTime() - checkInDate.getTime()) / (1000 * 60 * 60); // en heures
        
        if (!averageWorkTimeByDay[dateKey]) {
          averageWorkTimeByDay[dateKey] = {
            totalHours: 0,
            count: 0
          };
        }
        
        averageWorkTimeByDay[dateKey].totalHours += workDuration;
        averageWorkTimeByDay[dateKey].count += 1;
      }
    }
    
    const workTimeData = Object.entries(averageWorkTimeByDay).map(([date, data]) => {
      const { totalHours, count } = data as { totalHours: number, count: number };
      return {
        date,
        averageHours: totalHours / count,
        formattedDate: format(new Date(date), 'dd/MM')
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Retourner toutes les données
    return NextResponse.json({
      users: totalUsers,
      checkIns: totalCheckIns,
      pauses: totalPauses,
      checkOuts: totalCheckOuts,
      recentCheckIns: checkIns.slice(0, 5).map(ci => ({
        id: ci.id,
        timestamp: ci.timestamp,
        userName: ci.user?.name || ci.user?.email || "Utilisateur inconnu",
        location: ci.address,
        isReturn: ci.isReturn
      })),
      recentPauses: pauses.slice(0, 5).map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        userName: p.user?.name || p.user?.email || "Utilisateur inconnu"
      })),
      recentCheckOuts: checkOuts.slice(0, 5).map(co => ({
        id: co.id,
        timestamp: co.timestamp,
        userName: co.user?.name || co.user?.email || "Utilisateur inconnu",
        location: co.address
      })),
      weeklyActivity,
      workTimeData
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des données du tableau de bord:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
} 