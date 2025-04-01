"use client";

import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

// Schéma de validation pour le formulaire
const formSchema = z.object({
  absenceDate: z.date({
    required_error: "Une date d'absence est requise.",
  }).refine(date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, {
    message: "La date d'absence doit être dans le futur.",
  }),
  period: z.enum(["MORNING", "AFTERNOON", "FULL_DAY", "CUSTOM"], {
    required_error: "Une période d'absence est requise."
  }),
  reason: z.enum(["FAMILY", "SICK_CHILD", "MEDICAL", "OTHER"], {
    required_error: "Un motif d'absence est requis."
  }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  comment: z.string().optional(),
}).refine(
  (data) => data.period !== "CUSTOM" || (data.startTime && data.endTime),
  {
    message: "Les heures de début et de fin sont requises pour une période personnalisée",
    path: ["startTime"]
  }
);

// Type déduit du schéma
type FormValues = z.infer<typeof formSchema>;

// Périodes d'absence disponibles
const absencePeriods = [
  { id: "MORNING", label: "Matin" },
  { id: "AFTERNOON", label: "Après-midi" },
  { id: "FULL_DAY", label: "Journée complète" },
  { id: "CUSTOM", label: "Horaires personnalisés" }
];

// Raisons d'absence disponibles
const absenceReasons = [
  { id: "FAMILY", label: "Évènement familial" },
  { id: "SICK_CHILD", label: "Enfant malade" },
  { id: "MEDICAL", label: "Rendez-vous médical" },
  { id: "OTHER", label: "Autre" },
];

export function LeaveRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: "FULL_DAY",
      comment: '',
    },
  });

  // Gestion de la soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitStatus('loading');
    
    try {
      // Préparer les données pour l'API
      const payload = {
        absenceDate: format(data.absenceDate, 'yyyy-MM-dd'),
        period: data.period,
        reason: data.reason,
        startTime: data.startTime,
        endTime: data.endTime,
        userComment: data.comment || undefined
      };
      
      // Envoyer la demande à l'API
      const response = await fetch('/api/absence-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue lors de la soumission');
      }
      
      // Succès
      setSubmitStatus('success');
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'absence a été soumise avec succès.",
      });
      
      // Réinitialiser le formulaire après un succès
      form.reset();
    } catch (error) {
      // Erreur
      setSubmitStatus('error');
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Une erreur inconnue est survenue');
      }
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un problème est survenu lors de l'envoi de votre demande.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier si la période est personnalisée
  const isCustomPeriod = form.watch('period') === 'CUSTOM';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Demande d'absence</CardTitle>
      </CardHeader>
      <CardContent>
        {submitStatus === 'success' && (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Demande soumise avec succès</AlertTitle>
            <AlertDescription>
              Votre demande d'absence a été enregistrée et est en attente d'approbation.
            </AlertDescription>
          </Alert>
        )}
        
        {submitStatus === 'error' && (
          <Alert className="mb-4 bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {errorMessage || "Un problème est survenu lors de l'envoi de votre demande."}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="absenceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">Date d'absence</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal border-gray-300 hover:bg-gray-100",
                              !field.value && "text-gray-700"
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: fr })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-100" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today || date.getDay() === 0 || date.getDay() === 6;
                          }}
                          locale={fr}
                          className="text-gray-900"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Période</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 text-gray-900 hover:bg-gray-100">
                          <SelectValue className="text-gray-900" placeholder="Sélectionnez une période" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {absencePeriods.map(period => (
                          <SelectItem key={period.id} value={period.id} className="text-gray-900 hover:bg-gray-100">
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
            </div>
            
            {isCustomPeriod && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Heure de début</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input
                            type="time"
                            {...field}
                            className="flex-1 border-gray-300 text-gray-900"
                          />
                          <Clock className="ml-2 h-4 w-4 text-gray-700" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Heure de fin</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input
                            type="time"
                            {...field}
                            className="flex-1 border-gray-300 text-gray-900"
                          />
                          <Clock className="ml-2 h-4 w-4 text-gray-700" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Motif d'absence</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-300 text-gray-900 hover:bg-gray-100">
                        <SelectValue className="text-gray-900" placeholder="Sélectionnez un motif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {absenceReasons.map(reason => (
                        <SelectItem key={reason.id} value={reason.id} className="text-gray-900 hover:bg-gray-100">
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Précisions sur votre absence..."
                      className="resize-none border-gray-300 text-gray-900"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
            
            <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                    <span className="animate-spin mr-2">⏳</span>
                  Envoi en cours...
                </>
              ) : (
                "Soumettre la demande"
              )}
            </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 