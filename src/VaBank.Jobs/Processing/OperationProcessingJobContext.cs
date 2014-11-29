﻿using VaBank.Common.Data.Database;
using VaBank.Jobs.Common;
using VaBank.Services.Contracts.Processing;
using VaBank.Services.Contracts.Processing.Events;

namespace VaBank.Jobs.Processing
{
    public class OperationProcessingJobContext : DefaultJobContext<OperationProgressEvent>, ITransactionalJobContext
    {
        public IProcessingService ProcessingService { get; set; }
        public ITransactionFactory TransactionFactory { get; set; }
    }
}
