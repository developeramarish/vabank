﻿using System;
using System.Linq;
using VaBank.Common.Data;
using VaBank.Core.Maintenance;
using VaBank.Services.Contracts.Maintenance;

namespace VaBank.Services.Maintenance
{
    internal static class MaintenanceExtensions
    {
        public static IQuery ToDbQuery(this SystemLogClearCommand command)
        {
            if (command == null)
            {
                throw new ArgumentNullException("command");
            }
            return DbQuery.For<SystemLogEntry>().FilterBy(x => command.Ids.Contains(x.Id));
        } 
    }
}