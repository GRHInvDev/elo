"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { useForm } from "react-hook-form"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  // Adicionar estado para controlar a abertura do popover
  const [isOpen, setIsOpen] = React.useState(false)

  const form = useForm({
    defaultValues: {
      datetime: date,
    },
  })

  React.useEffect(() => {
    form.reset({ datetime: date })
  }, [date, form])

  function onSubmit(values: { datetime: Date | undefined }) {
    setDate(values.datetime)
    setIsOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="datetime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      disabled={disabled}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPp", { locale: ptBR })
                      ) : (
                        <span>Selecione a data e hora</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date)
                          if (field.value) {
                            // Preserve the time when selecting a new date
                            newDate.setHours(field.value.getHours())
                            newDate.setMinutes(field.value.getMinutes())
                          } else {
                            // Default to current time if no time was previously selected
                            const now = new Date()
                            newDate.setHours(now.getHours())
                            newDate.setMinutes(now.getMinutes())
                          }
                          field.onChange(newDate)
                        } else {
                          field.onChange(undefined)
                        }
                      }}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                    <div className="border-t border-border p-3">
                      <TimePicker
                        date={field.value}
                        setDate={(newDate) => field.onChange(newDate)}
                        disabled={!field.value}
                      />
                    </div>
                    <div className="flex justify-end p-3 border-t border-border">
                      <Button
                        type="button"
                        onClick={async () => {
                          await form.handleSubmit(onSubmit)()
                        }}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

