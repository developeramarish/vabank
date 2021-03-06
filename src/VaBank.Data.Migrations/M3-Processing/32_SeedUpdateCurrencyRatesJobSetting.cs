﻿using FluentMigrator;
using Newtonsoft.Json;

namespace VaBank.Data.Migrations
{
    [Migration(32, "Seed UpdateCurrencyRates job setting")]
    [Tags("Development", "Test")]
    public class SeedUpdateCurrencyRatesJobSetting : Migration
    {
        private const string SettingKey = "VaBank.Jobs.{0}";

        public override void Down()
        {
        }

        public override void Up()
        {
            //TODO: Invoke insert method
        }

        private object UpdateCurrencyRates()
        {
            //TODO: Fill real cron expression
            var config = new { CronExpression = "" };
            var json = JsonConvert.SerializeObject(config);
            var node = JsonConvert.DeserializeXNode(json, "Setting");
            return new { Key = string.Format(SettingKey, "UpdateCurrencyRates"), Value = node.ToString() };
        }
    }
}
