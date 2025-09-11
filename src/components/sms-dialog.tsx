
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';

import type { Property } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSms, getSmsConfig } from '@/lib/sms-service';
import { getPropertyValue } from '@/lib/property-utils';

interface SmsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedProperties: Property[];
}

const smsFormSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters.").max(480, "Message is too long."),
});

export function SmsDialog({ isOpen, onOpenChange, selectedProperties }: SmsDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [isSmsConfigured, setIsSmsConfigured] = useState(false);

  const form = useForm<z.infer<typeof smsFormSchema>>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: {
      message: "Dear {{Owner Name}}, this is a friendly reminder regarding your property ({{Property No}}). Please contact the District Assembly for more information.",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const config = getSmsConfig();
      setIsSmsConfigured(!!config.smsApiUrl && !!config.smsApiKey && !!config.smsSenderId);
      form.reset();
      setIsSending(false);
      setSentCount(0);
    }
  }, [isOpen, form]);

  const recipientCount = selectedProperties.filter(p => getPropertyValue(p, 'Phone Number')).length;

  async function onSubmit(data: z.infer<typeof smsFormSchema>) {
    if (!isSmsConfigured) {
        toast({
            variant: 'destructive',
            title: 'SMS Not Configured',
            description: 'Please configure SMS settings on the Settings page first.',
        });
        return;
    }
    
    setIsSending(true);
    setSentCount(0);

    const results = await sendSms(selectedProperties, data.message);
    const successfulSends = results.filter(r => r.success).length;
    
    // This is a more realistic simulation of batch sending progress
    for (let i = 0; i <= successfulSends; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setSentCount(i);
    }

    setIsSending(false);
    
    if (successfulSends === 0 && recipientCount > 0) {
      toast({
        variant: 'destructive',
        title: 'SMS Sending Failed',
        description: `Could not send SMS to any of the ${recipientCount} valid recipients. Check settings or phone numbers.`,
      });
    } else if (recipientCount === 0) {
       toast({
        variant: 'destructive',
        title: 'No Recipients',
        description: `None of the selected properties have a valid phone number.`,
      });
    } else {
      toast({
        title: 'SMS Sending Complete',
        description: `Successfully sent ${successfulSends} out of ${recipientCount} possible messages.`,
      });
    }

    if (successfulSends > 0) {
        setTimeout(() => onOpenChange(false), 800);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Send Bulk SMS
          </DialogTitle>
          <DialogDescription>
            Compose a message to send to the {recipientCount} selected properties with a valid phone number.
            You can use placeholders like {'{{Owner Name}}'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Type your message here..."
                      disabled={isSending || !isSmsConfigured}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isSmsConfigured && (
                <p className="text-sm text-destructive font-medium text-center">
                    SMS is not configured. Please set it up in the Settings page.
                </p>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending || recipientCount === 0 || !isSmsConfigured}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending... ({sentCount}/{recipientCount})
                  </>
                ) : (
                  `Send to ${recipientCount} recipients`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
