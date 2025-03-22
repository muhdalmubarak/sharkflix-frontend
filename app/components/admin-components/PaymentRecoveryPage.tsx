"use client";

import React, { useState, ChangeEvent, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn-ui/card';
import { Button } from '@/components/shadcn-ui/button';
import { Alert, AlertDescription } from '@/components/shadcn-ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn-ui/tabs';
import { Badge } from '@/components/shadcn-ui/badge';
import { AlertTriangle, CreditCard, Clock, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn-ui/accordion';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';

interface PaymentRecord {
  transaction_id: string;
  order_id: string;
  merchant_email: string;
  amount: string;
  payment_method: string;
  created_at: string;
}

interface DuplicatePayment {
  merchant_email: string;
  transactions: Array<{
    transaction_id: string;
    amount: string;
    payment_method: string;
    created_at: string;
    order_id: string;
  }>;
}

interface AnalysisResult {
  totalRecords: number;
  eventRecords: number;
  nonEventRecords: number;
  successfulPayments: number;
  missingRecords: number;
  recordsToRecover: PaymentRecord[];
  skippedRecords?: Array<{
    transaction_id: string;
    order_id: string;
  }>;
  duplicatePaymentsByEmail?: DuplicatePayment[];
  paymentMethodBreakdown: {
    [key: string]: number;
  };
}

interface RecoveryStatus {
  inProgress: boolean;
  stage: 'preparing' | 'standard' | 'tng-ewallet' | 'complete';
  standardProgress: number;
  tngEwalletProgress: number;
  standardTotal: number;
  tngEwalletTotal: number;
  error?: string;
}

const PaymentRecoveryPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>({
    inProgress: false,
    stage: 'preparing',
    standardProgress: 0,
    tngEwalletProgress: 0,
    standardTotal: 0,
    tngEwalletTotal: 0
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('toRecover');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
      setError('');
      setSuccessMessage('');
    }
  };

  const countTngEwalletRecords = (records: PaymentRecord[]): number => {
    return records.filter(r => r.payment_method.toUpperCase().includes('TNG-EWALLET')).length;
  };

  const countOtherRecords = (records: PaymentRecord[]): number => {
    return records.filter(r => !r.payment_method.toUpperCase().includes('TNG-EWALLET')).length;
  };

  const submitFileAction = async (action: 'analyze' | 'recover') => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);

    try {
      if (action === 'analyze') {
        setIsAnalyzing(true);
      } else if (action === 'recover') {
        setIsRecovering(true);

        // Initialize recovery status
        const tngEwalletCount = analysis ? countTngEwalletRecords(analysis.recordsToRecover) : 0;
        const standardCount = analysis ? countOtherRecords(analysis.recordsToRecover) : 0;

        setRecoveryStatus({
          inProgress: true,
          stage: 'standard',
          standardProgress: 0,
          tngEwalletProgress: 0,
          standardTotal: standardCount,
          tngEwalletTotal: tngEwalletCount
        });
      }

      const response = await fetch('/api/payment-recovery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      const result = await response.json();

      if (action === 'analyze') {
        setAnalysis(result);
      } else {
        // Set completion status directly without simulation
        setRecoveryStatus({
          inProgress: false,
          stage: 'complete',
          standardProgress: 100,
          tngEwalletProgress: 100,
          standardTotal: countOtherRecords(analysis?.recordsToRecover || []),
          tngEwalletTotal: countTngEwalletRecords(analysis?.recordsToRecover || [])
        });

        setSuccessMessage(`Successfully processed ${result.processed} payments. ${result.duplicateCustomers || 0} customers had duplicate payments (only first payment processed). ${result.skipped || 0} non-event transactions were skipped.`);
        setAnalysis(null);
      }
    } catch (err) {
      console.error(`${action} error:`, err);
      setError(`Failed to ${action} file: ` + (err instanceof Error ? err.message : 'Unknown error'));

      // Reset loading states and recovery status when errors occur
      if (action === 'analyze') {
        setIsAnalyzing(false);
      } else if (action === 'recover') {
        setIsRecovering(false);
        setRecoveryStatus({
          inProgress: false,
          stage: 'preparing',
          standardProgress: 0,
          tngEwalletProgress: 0,
          standardTotal: 0,
          tngEwalletTotal: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    } finally {
      if (action === 'analyze') {
        setIsAnalyzing(false);
      } else if (action === 'recover') {
        // Make sure isRecovering is set to false even if there's no error
        setIsRecovering(false);
      }
    }
  };

  // Clean up processing states when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function to ensure we don't have lingering states
      setIsAnalyzing(false);
      setIsRecovering(false);
      setRecoveryStatus({
        inProgress: false,
        stage: 'preparing',
        standardProgress: 0,
        tngEwalletProgress: 0,
        standardTotal: 0,
        tngEwalletTotal: 0
      });
    };
  }, []);

  const analyzeFile = async () => {
    setError('');
    await submitFileAction('analyze');
  };

  const downloadRecoveryFile = () => {
    if (!analysis || !analysis.recordsToRecover.length) return;

    // Create a worksheet with only records to recover
    const ws = utils.json_to_sheet(analysis.recordsToRecover);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Recovery");

    // Generate file and use file-saver to download it
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, "payhalal_recovery_file.xlsx");
  };

  const downloadRecoveryCSV = () => {
    if (!analysis || !analysis.recordsToRecover.length) return;

    // Define the columns you want to include
    const columns = ['transaction_id', 'order_id', 'merchant_email', 'amount', 'payment_method', 'created_at'];

    // Create CSV header row
    let csvContent = columns.join(',') + '\n';

    // Add data rows
    analysis.recordsToRecover.forEach(record => {
      const row = columns.map(column => {
        // Escape commas and quotes in values
        const value = record[column as keyof typeof record] || '';
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',');
      csvContent += row + '\n';
    });

    // Create downloadable blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'payhalal_recovery_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recoverPayments = async () => {
    setError('');
    await submitFileAction('recover');
  };

  // Count duplicate transactions
  const totalDuplicateTransactions = analysis?.duplicatePaymentsByEmail?.reduce(
    (sum, item) => sum + (item.transactions.length - 1), 0
  ) || 0;

  // Get TNG-EWALLET count for displaying in UI
  const tngEwalletCount = analysis
    ? analysis.paymentMethodBreakdown['TNG-EWALLET'] || 0
    : 0;

  const renderRecoveryStatus = () => {
    if (!recoveryStatus.inProgress && !recoveryStatus.error) return null;

    return (
      <div className="mt-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-4">Recovery Status</h3>

        {recoveryStatus.error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>Error: {recoveryStatus.error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-4">
              <p className="mb-2">
                {recoveryStatus.stage === 'preparing' && 'Preparing recovery process...'}
                {recoveryStatus.stage === 'standard' && `Processing payments... This may take a few minutes.`}
                {recoveryStatus.stage === 'complete' && 'All payments processed successfully!'}
              </p>

              {recoveryStatus.inProgress && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {(recoveryStatus.stage === 'standard' && recoveryStatus.tngEwalletTotal > 0) && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  TNG-EWALLET payments may take longer to process due to extended processing requirements.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Payment Sync Assistant</CardTitle>
          <CardDescription>
            Upload PayHalal export file to analyze and recover missing payments.
            Easily find and restore any missing payments from your PayHalal transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium mb-2"
                >
                  Upload File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <Button
                onClick={analyzeFile}
                disabled={!file || isAnalyzing || recoveryStatus.inProgress}
                className="h-10"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : 'Analyze'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-400">
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{error}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {renderRecoveryStatus()}

            {analysis && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">Analysis Results</h3>
                  <div className="space-y-2">
                    <p>Total records: {analysis.totalRecords}</p>
                    <p>Event records: {analysis.eventRecords}</p>
                    <p>Non-event records (skipped): {analysis.nonEventRecords}</p>
                    <p>Successful event payments: {analysis.successfulPayments}</p>
                    <p className="font-medium">Records to recover: {analysis.missingRecords}</p>

                    {tngEwalletCount > 0 && (
                      <div className="mt-2 text-amber-700">
                        <p className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1.5" />
                          {tngEwalletCount} TNG-EWALLET payments detected
                        </p>
                        <p className="text-sm ml-6">These may take longer to process</p>
                      </div>
                    )}

                    {analysis.duplicatePaymentsByEmail && analysis.duplicatePaymentsByEmail.length > 0 && (
                      <p className="font-medium text-amber-700">
                        Duplicate payments detected: {totalDuplicateTransactions} transactions from {analysis.duplicatePaymentsByEmail.length} customers
                      </p>
                    )}

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Payment Method Breakdown:</h4>
                      {Object.entries(analysis.paymentMethodBreakdown).map(([method, count]) => (
                        <p key={method} className="text-sm">
                          {method}: {count} transactions
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {analysis.missingRecords > 0 && (
                  <div className="flex gap-3 mb-4">
                    <Button onClick={downloadRecoveryFile} variant="outline" className="flex-1">
                      Download XLSX Recovery File
                    </Button>
                    <Button onClick={downloadRecoveryCSV} variant="outline" className="flex-1">
                      Download CSV Recovery File
                    </Button>
                  </div>
                )}

                {analysis.missingRecords > 0 && (
                  <Button
                    onClick={recoverPayments}
                    disabled={isRecovering || recoveryStatus.inProgress}
                    className="w-full"
                  >
                    {isRecovering || recoveryStatus.inProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : `Recover ${analysis.missingRecords} Payments`}
                  </Button>
                )}

                <Tabs defaultValue="toRecover" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="toRecover">
                      To Recover ({analysis.recordsToRecover?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="duplicates">
                      Duplicates ({analysis.duplicatePaymentsByEmail?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="skipped">
                      Skipped ({analysis.skippedRecords?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="toRecover">
                    {analysis.recordsToRecover?.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.recordsToRecover.map((record) => (
                          <div
                            key={record.transaction_id}
                            className={`p-4 rounded-lg border ${record.payment_method.toUpperCase().includes('TNG-EWALLET') ? 'border-blue-200' : 'bg-card'}`}
                          >
                            <div className="grid gap-2">
                              <div className="flex justify-between">
                                <p><span className="font-medium">Transaction ID:</span> {record.transaction_id}</p>
                                {record.payment_method.toUpperCase().includes('TNG-EWALLET') && (
                                  <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300">
                                    Extended Processing
                                  </Badge>
                                )}
                              </div>
                              <p><span className="font-medium">Order ID:</span> {record.order_id}</p>
                              <p><span className="font-medium">Customer:</span> {record.merchant_email}</p>
                              <p><span className="font-medium">Amount:</span> {record.amount}</p>
                              <p><span className="font-medium">Payment Method:</span> {record.payment_method}</p>
                              <p><span className="font-medium">Created At:</span> {record.created_at}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No payments need to be recovered
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="duplicates">
                    {analysis.duplicatePaymentsByEmail && analysis.duplicatePaymentsByEmail.length > 0 ? (
                      <div className="space-y-4">
                        <Alert className="border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-800 mr-2" />
                          <AlertDescription className="text-amber-800">
                            {totalDuplicateTransactions} duplicate transactions detected from {analysis.duplicatePaymentsByEmail.length} customers.
                            Only the first payment per customer will be processed.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          {analysis.duplicatePaymentsByEmail.map((item, index) => (
                            <Accordion key={index} type="single" collapsible>
                              <AccordionItem value={`item-${index}`} className="border rounded-lg overflow-hidden">
                                <AccordionTrigger className="px-4 py-3">
                                  <div className="flex items-center justify-between w-full text-left">
                                    <div>
                                      <p className="font-medium">{item.merchant_email}</p>
                                      <p className="text-sm text-gray-500">{item.transactions.length} transactions detected</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2 text-amber-800 border-amber-300">
                                      {item.transactions.length - 1} duplicates
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 p-4">
                                    {item.transactions.map((transaction, tIndex) => (
                                      <div
                                        key={transaction.transaction_id}
                                        className={`p-3 rounded-lg border ${tIndex === 0 ? 'border-green-200' : 'border-amber-200'}`}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant={tIndex === 0 ? "secondary" : "outline"} className={tIndex === 0 ? "bg-green-100 text-green-800 border-green-300" : "bg-amber-100 text-amber-800 border-amber-300"}>
                                            {tIndex === 0 ? 'To Be Processed' : 'Will Be Skipped'}
                                          </Badge>
                                          <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {transaction.created_at}
                                          </div>
                                        </div>
                                        <div className="grid gap-1 text-sm">
                                          <p><span className="font-medium">Transaction ID:</span> {transaction.transaction_id}</p>
                                          <p><span className="font-medium">Order ID:</span> {transaction.order_id}</p>
                                          <p><span className="font-medium">Amount:</span> {transaction.amount}</p>
                                          <p>
                                            <span className="font-medium">Payment Method:</span>
                                            <span className="inline-flex items-center ml-1">
                                              <CreditCard className="h-3 w-3 mr-1" />
                                              {transaction.payment_method}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No duplicate payments detected
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="skipped">
                    {(analysis.skippedRecords && analysis.skippedRecords.length > 0) ? (
                      <div>
                        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                          <AlertDescription className="text-yellow-800">
                            These non-event transactions were automatically skipped as they don't follow the EVENT_ID_TIMESTAMP format.
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                          {analysis.skippedRecords.map((record) => (
                            <div
                              key={record.transaction_id}
                              className="p-4 rounded-lg border bg-card"
                            >
                              <div className="grid gap-2">
                                <p><span className="font-medium">Transaction ID:</span> {record.transaction_id}</p>
                                <p><span className="font-medium">Order ID:</span> {record.order_id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No records were skipped
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentRecoveryPage;
