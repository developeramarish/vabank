﻿using System;

namespace VaBank.Core.Entities.Membership
{
    public class UserProfile : Entity<Guid>
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool SmsConfiramationEnabled { get; set; }
        public bool SmsNotificationEnabled { get; set; }
        public string SecretPhrase { get; set; }
    }
}
