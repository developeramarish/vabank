﻿using VaBank.Common.Validation;
using VaBank.Core.Accounting.Entities;
using VaBank.Core.Processing.Entities;

namespace VaBank.Core.Processing
{
    //TODO: write withdraw and deposit for base account
    internal static class ProcessingExtensions
    {
        public static CardTransaction Withdraw(
            this UserCard userCard, 
            string description,
            string location,
            Money money, 
            MoneyConverter moneyConverter)
        {
            Argument.NotEmpty(description, "description");
            Argument.NotNull(userCard, "userCard");
            Argument.NotNull(money, "money");
            Argument.NotNull(moneyConverter, "moneyConverter");
            Argument.Satisfies(money, x => x.Amount >= 0, "money", "Money amount should be 0 or greater.");
            Argument.Satisfies(userCard, x => x.Account != null, "userCard", "Card should be bound to a bank account.");

            var convertedMoney = Withdraw(userCard.Account, money, moneyConverter);
            return new CardTransaction(description, location, userCard, money.Currency, - money.Amount, - convertedMoney.Amount, userCard.Account.Balance);
        }

        public static CardTransaction Deposit(
            this UserCard userCard,
            string description,
            string location,
            Money money, 
            MoneyConverter moneyConverter)
        {
            Argument.NotEmpty(description, "description");
            Argument.NotNull(userCard, "userCard");
            Argument.NotNull(money, "money");
            Argument.NotNull(moneyConverter, "moneyConverter");
            Argument.Satisfies(money, x => x.Amount >= 0, "money", "Money amount should be 0 or greater.");
            Argument.Satisfies(userCard, x => x.Account != null, "userCard", "Card should be bound to a bank account.");

            var convertedMoney = Deposit(userCard.Account, money, moneyConverter);
            return new CardTransaction(description, location, userCard, money.Currency, money.Amount, convertedMoney.Amount, userCard.Account.Balance);
        }

        private static Money Withdraw(this Account account, Money money, MoneyConverter moneyConverter)
        {
            var moneyToWithdraw = moneyConverter.Convert(money, account.Currency.ISOName);
            account.Withdraw(moneyToWithdraw.Amount);
            return moneyToWithdraw;
        }

        private static Money Deposit(this Account account, Money money, MoneyConverter moneyConverter)
        {
            var moneyToDeposit = moneyConverter.Convert(money, account.Currency.ISOName);
            account.Deposit(moneyToDeposit.Amount);
            return moneyToDeposit;
        }
    }
}
