import {Button} from "@/components/shadcn-ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import * as React from "react";
import {useEffect, useState} from "react";
import {Info, Loader} from "lucide-react";
import {CalendarDateRangePicker} from "@/components/creator-dashboard/components/date-range-picker";
import {DateRange} from "react-day-picker";
import {format, subDays} from "date-fns";
import {Alert, AlertDescription} from "@/components/shadcn-ui/alert";
import {useToast} from "@/hooks/use-toast";

interface iAppProps {
    state: boolean;
    changeState: any;
    operationStatus: any;
    title: string;
    overview?: string;
}

export default function PaymentSyncModal({
                                             state,
                                             changeState,
                                             operationStatus,
                                             title,
                                             overview,
                                         }: iAppProps) {
    const [syncResponse, setSyncResponse] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [range, setRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [loading, setLoading] = useState(false);
    const {toast} = useToast();

    useEffect(() => {
        const formattedStartDate = range?.from ? format(range.from, 'yyyy-MM-dd') : undefined;
        const formattedEndDate = range?.to ? format(range.to, 'yyyy-MM-dd') : undefined;
        if (formattedStartDate) setStartDate(formattedStartDate);
        if (formattedEndDate) setEndDate(formattedEndDate);
    }, [range]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/admin/payments/payhalal/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({startDate, endDate}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const syncedTransactionsResponse = await response.json();

            if (syncedTransactionsResponse.success && syncedTransactionsResponse.message) {
                changeState(false);
                operationStatus(syncedTransactionsResponse);
                toast({
                    title: "Success",
                    description: syncedTransactionsResponse.message
                });
            }
        } catch (error: any) {
            setSyncResponse(error.message);
        }

        setLoading(false);
    };

    return (
        <>
            <Dialog open={state} onOpenChange={() => changeState(!state)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {overview &&
                            <DialogDescription className="line-clamp-3">
                                {overview}
                            </DialogDescription>
                        }
                    </DialogHeader>

                    {syncResponse &&
                        <Alert variant="destructive" className={`border-2 flex items-center text-white`}>
                            <Info className="h-5 w-5 text-white"/>
                            <AlertDescription className="text-sm ml-2 mt-0.5">
                                {syncResponse}
                            </AlertDescription>
                        </Alert>
                    }
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 mt-5">
                            <CalendarDateRangePicker
                                className={"justify-center"}
                                value={range}
                                onDateChange={setRange}
                                minDate={subDays(new Date(), 30)}
                                maxDate={new Date()}
                            />
                            <Button
                                type="submit"
                                variant="destructive"
                                className="w-full bg-[#e50914]"
                                disabled={loading || !startDate || !endDate}
                            >
                                {loading ? (
                                    <Loader className="mr-2 animate-spin"/> // Loader icon
                                ) : (
                                    "Sync"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
