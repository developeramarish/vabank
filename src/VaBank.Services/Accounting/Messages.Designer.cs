﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.18444
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace VaBank.Services.Accounting {
    using System;
    
    
    /// <summary>
    ///   A strongly-typed resource class, for looking up localized strings, etc.
    /// </summary>
    // This class was auto-generated by the StronglyTypedResourceBuilder
    // class via a tool like ResGen or Visual Studio.
    // To add or remove a member, edit your .ResX file then rerun ResGen
    // with the /str option, or rebuild your VS project.
    [global::System.CodeDom.Compiler.GeneratedCodeAttribute("System.Resources.Tools.StronglyTypedResourceBuilder", "4.0.0.0")]
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
    [global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
    public class Messages {
        
        private static global::System.Resources.ResourceManager resourceMan;
        
        private static global::System.Globalization.CultureInfo resourceCulture;
        
        [global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
        internal Messages() {
        }
        
        /// <summary>
        ///   Returns the cached ResourceManager instance used by this class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        public static global::System.Resources.ResourceManager ResourceManager {
            get {
                if (object.ReferenceEquals(resourceMan, null)) {
                    global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("VaBank.Services.Accounting.Messages", typeof(Messages).Assembly);
                    resourceMan = temp;
                }
                return resourceMan;
            }
        }
        
        /// <summary>
        ///   Overrides the current thread's CurrentUICulture property for all
        ///   resource lookups using this strongly typed resource class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        public static global::System.Globalization.CultureInfo Culture {
            get {
                return resourceCulture;
            }
            set {
                resourceCulture = value;
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Карт-счет №{0} был успешно открыт..
        /// </summary>
        public static string AccountOpened {
            get {
                return ResourceManager.GetString("AccountOpened", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Карта {0} была заблокирована!.
        /// </summary>
        public static string CardBlocked {
            get {
                return ResourceManager.GetString("CardBlocked", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Была успешно выпущена карта с номером: {0}..
        /// </summary>
        public static string CardEmitted {
            get {
                return ResourceManager.GetString("CardEmitted", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Карта была успешно привязана к карт-счету..
        /// </summary>
        public static string CardLinked {
            get {
                return ResourceManager.GetString("CardLinked", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Настройки карты были успешно обновлены..
        /// </summary>
        public static string CardSettingsUpdated {
            get {
                return ResourceManager.GetString("CardSettingsUpdated", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Карта {0} разблокирована!.
        /// </summary>
        public static string CardUnblocked {
            get {
                return ResourceManager.GetString("CardUnblocked", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Карта была успешно отвязана от счета..
        /// </summary>
        public static string CardUnlinked {
            get {
                return ResourceManager.GetString("CardUnlinked", resourceCulture);
            }
        }
    }
}
