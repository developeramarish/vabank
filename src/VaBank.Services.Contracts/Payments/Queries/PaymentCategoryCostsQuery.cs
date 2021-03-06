﻿using System;
using VaBank.Services.Contracts.Common.Queries;

namespace VaBank.Services.Contracts.Payments.Queries
{
    public class PaymentCategoryCostsQuery : IRangeQuery<DateTime>
    {
        public Guid CardId { get; set; }

        public DateTime From { get; set; }

        public DateTime To { get; set; }
    }
}
