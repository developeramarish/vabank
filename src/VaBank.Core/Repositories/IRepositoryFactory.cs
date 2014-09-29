﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VaBank.Core.Entities;

namespace VaBank.Core.Repositories
{
    public interface IRepositoryFactory
    {
        IRepository<Log, Guid> LogRepository { get; }
    }
}