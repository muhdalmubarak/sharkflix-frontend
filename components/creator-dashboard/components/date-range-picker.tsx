"use client"

import * as React from "react"
import {CalendarIcon} from "@radix-ui/react-icons"
import {format} from "date-fns"
import type {Matcher} from "react-day-picker"
import {DateRange} from "react-day-picker"

import {cn} from "@/lib/utils"
import {Button} from "@/components/shadcn-ui/button"
import {Calendar} from "@/components/shadcn-ui/calendar"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/shadcn-ui/popover"

export function CalendarDateRangePicker({
                                            className,
                                            value,
                                            onDateChange,
                                            minDate,
                                            maxDate,
                                        }: {
    className?: string
    value?: DateRange
    onDateChange?: (range: DateRange | undefined) => void
    minDate?: Date
    maxDate?: Date
}) {
    const [date, setDate] = React.useState<DateRange | undefined>(value)

    React.useEffect(() => {
        if (value !== undefined) setDate(value)
    }, [value])

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)
        onDateChange?.(range)
    }

    const disabled: Matcher[] = []
    if (minDate) disabled.push({before: minDate})
    if (maxDate) disabled.push({after: maxDate})

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4"/>
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        disabled={disabled.length ? disabled : undefined}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
