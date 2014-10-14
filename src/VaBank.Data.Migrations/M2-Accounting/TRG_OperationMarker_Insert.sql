﻿/****** Object:  Trigger [App].[TRG_Insert_OperationMarker]    Script Date: 13.10.2014 23:40:37 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

--Create an INSTEAD OF INSERT trigger on the view.
CREATE TRIGGER [App].[TRG_Insert_OperationMarker] on [App].[OperationMarker]
INSTEAD OF INSERT
AS
BEGIN
  INSERT INTO [App].[OperationMarker] 
         ([TimestampUtc], [Name], [TransactionId], [AppUserId], [AppClientId])
  SELECT ISNULL([inserted].[TimestampUtc], GETUTCDATE()),
		 ISNULL([inserted].[Name], N'DB-CHANGE'),
		 (SELECT [transaction_id] FROM [sys].[dm_tran_current_transaction]),
		 [inserted].[AppUserId],
		 [inserted].[AppClientId]
  FROM inserted
END;

GO