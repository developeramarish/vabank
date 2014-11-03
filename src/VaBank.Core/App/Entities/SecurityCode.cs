﻿using System;
using VaBank.Common.Security;
using VaBank.Core.Common;

namespace VaBank.Core.App.Entities
{
    public class SecurityCode : Entity<Guid>
    {
        internal SecurityCode(Guid id, TimeSpan expirationPeriod, string code)
        {
            Id = id;
            ExpirationDateUtc = DateTime.UtcNow + expirationPeriod;
            CodeHash = Hash.Compute(code);
            IsActive = true;
        }

        public DateTime ExpirationDateUtc { get; internal set; }

        public string CodeHash { get; private set; }

        public bool IsActive { get; private set; }

        public bool Deactivate(string code)
        {
            IsActive = false;
            if (string.IsNullOrEmpty(code))
            {
                return false;
            }
            return Hash.Compute(code) == CodeHash && ExpirationDateUtc > DateTime.UtcNow;
        }
    }
}
