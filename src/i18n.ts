type Locale = 'zh-TW' | 'en'

const translations = {
  'zh-TW': {
    // Transaction types
    'label.type.expense': '支出',
    'label.type.income': '收入',
    'label.type.transfer': '移轉',

    // Wallet types
    'label.walletType.cash': '現金',
    'label.walletType.bank': '銀行帳戶',
    'label.walletType.creditCard': '信用卡',

    // Default expense categories
    'label.cat.food': '飲食',
    'label.cat.clothing': '服飾',
    'label.cat.housing': '住家',
    'label.cat.transport': '交通',
    'label.cat.education': '學習',
    'label.cat.entertainment': '休閒娛樂',
    'label.cat.shopping': '購物',
    'label.cat.medical': '醫療',
    'label.cat.cash_expense': '現金消費',
    'label.cat.insurance': '保險',
    'label.cat.fees': '費用／手續費',
    'label.cat.tax': '稅金',

    // Default income categories
    'label.cat.salary': '薪資',
    'label.cat.interest': '利息所得',
    'label.cat.side_income': '兼職',
    'label.cat.bonus': '獎金',
    'label.cat.lottery': '發票／彩券中獎',
    'label.cat.rent': '租金',
    'label.cat.cashback': '優惠回饋',
    'label.cat.dividend': '股利',
    'label.cat.investment_profit': '投資獲利',
    'label.cat.insurance_income': '保險理賠',
    'label.cat.pension': '退休金',

    // Default transfer categories
    'label.cat.account_transfer': '帳戶互轉',
    'label.cat.credit_card_payment': '信用卡繳費',
    'label.cat.investment_trade': '投資買賣',

    // Fallback
    'label.cat.uncategorized': '未分類',
    'label.cat.other': '其他',

    // UI labels
    'ui.addTransaction': '新增交易',
    'ui.detail': '明細',
    'ui.confirm': '確認',
    'ui.cancel': '取消',
    'ui.delete': '刪除',
    'ui.edit': '編輯',
    'ui.archive': '封存',
    'ui.save': '儲存',
    'ui.search': '搜尋',
    'ui.noMatches': '沒有符合的選項',

    // Dashboard
    'dashboard.title': '帳本總覽',
    'dash.income': '收入',
    'dash.expense': '支出',
    'dash.balance': '結餘',
    'dash.netAsset': '淨資產',
    'dash.walletBalances': '帳戶餘額',
    'dash.assetAllocation': '資金占比',
    'dash.expenseByCategory': '支出分類',
    'dash.expenseByTag': '支出標籤',
    'dash.untagged': '未加標籤',
    'dash.followUps': '待追蹤',
    'dash.noFollowUps': '沒有標記 #{tag} 的交易',
    'settings.followUpTag': '待追蹤標籤',
    'settings.followUpTagPlaceholder': '例如 follow_up',
    'settings.followUpTagDesc': '總覽的「待追蹤」卡片列出所有帶有此標籤的交易（不分月份）。留空則隱藏卡片。',
    'settings.chartExcludedTags': '標籤圖表略過的標籤',
    'settings.chartExcludedTagsDesc': '總覽「支出標籤」圖表不計入這些標籤，以逗號分隔。只有這些標籤的支出會算作未加標籤。',
    'settings.chartExcludedTagsPlaceholder': '例如 follow_up, reimbursable',
    'dash.noData': '本月無資料',

    // Detail view
    'detail.title': '收支明細',
    'detail.filterAll': '全部',
    'detail.filterExpense': '支出',
    'detail.filterIncome': '收入',
    'detail.filterTransfer': '轉帳',
    'detail.subtotalIncome': '收入小計',
    'detail.subtotalExpense': '支出小計',
    'detail.noTransactions': '無符合條件的交易',
    'detail.searchPlaceholder': '搜尋備註/標籤...',
    'detail.filterCategory': '分類',
    'detail.filterButton': '篩選',
    'detail.filterTitle': '篩選',
    'detail.filterType': '類型',
    'detail.filterAccount': '帳戶',
    'detail.filterAllAccounts': '全部帳戶',
    'detail.filterDateRange': '日期範圍',
    'detail.filterClearAll': '清除全部',
    'detail.filterDone': '完成',

    // Trend view
    'trend.monthlyExpense': '每月支出',

    // Date formatting
    'date.yearMonthNumeric': '{year} 年 {month} 月',
    'date.yearMonthShort': '{year} 年 {month} 月',
    'date.monthLabel': '{month}月',

    // Transaction modal
    'modal.addTitle': '新增交易',
    'modal.editTitle': '編輯交易',
    'modal.date': '日期',
    'modal.wallet': '帳戶',
    'modal.fromWallet': '轉出帳戶',
    'modal.toWallet': '轉入帳戶',
    'modal.category': '分類',
    'modal.note': '備註',
    'modal.tags': '標籤',
    'modal.tagsPlaceholder': '輸入標籤後按 Enter',
    'modal.done': '完成',
    'tagPicker.title': '選擇標籤',
    'tagPicker.search': '搜尋或輸入新標籤',
    'tagPicker.addTag': '+ 新增標籤',
    'tagPicker.addNamed': '+ 新增「{name}」',
    'tagPicker.noResults': '沒有包含「{searchTerm}」的標籤',
    'tagPicker.tagLimit': '已達標籤上限',
    'tagPicker.tooLong': '長度超過上限（中文 5 字 / 英數 30 字）無法新增',
    'tagPicker.rowPlaceholder': '選擇標籤',
    'modal.amount': '金額',

    // Validation errors
    'err.amountRequired': '請輸入金額',
    'err.amountPositive': '金額必須大於 0',
    'err.amountInteger': '目前設定不允許小數，請輸入整數金額',
    'err.walletRequired': '請選擇帳戶',
    'err.fromWalletRequired': '請選擇轉出帳戶',
    'err.toWalletRequired': '請選擇轉入帳戶',
    'err.sameWallet': '來源與目標錢包不能相同',
    'err.walletNameEmpty': '錢包名稱不能為空',
    'err.walletNameDuplicate': '錢包名稱已存在',
    'calculator.err.pendingExpression': '請先按 = 完成計算',
    'calculator.err.negativeResult': '計算結果不可為負數',
    'calculator.err.divideByZero': '不可除以 0',
    'calculator.done': '完成',

    // Settings
    'settings.general': '一般設定',
    'settings.folderName': '資料夾名稱',
    'settings.folderNameDesc': '存放記帳檔案的資料夾（相對於 Vault 根目錄）',
    'settings.defaultWallet': '預設帳戶',
    'settings.defaultWalletDesc': '新增支出與收入時記錄到的帳戶',
    'settings.decimalPlaces': '金額小數位數',
    'settings.decimalPlacesDesc': '記帳金額允許的小數位數',
    'settings.dp0': '整數（0 位）',
    'settings.dp2': '2 位小數',
    'settings.activeWallets': '使用中帳戶',
    'settings.archivedWallets': '已封存帳戶',
    'settings.addWallet': '新增帳戶',
    'settings.walletName': '名稱',
    'settings.walletType': '類型',
    'settings.initialBalance': '初始餘額',
    'settings.includeInNetAssetOn': '目前：納入淨資產',
    'settings.includeInNetAssetOff': '目前：不納入淨資產',
    'settings.customCategories': '分類',
    'settings.categoriesDesc': '內建分類可按 × 移除，之後可在「已移除」中還原。已使用該分類的交易不受影響。',
    'settings.removedCategories': '已移除：',
    'settings.tags': '標籤',
    'settings.tagsDesc': '新增交易時建議的標籤。按 × 從清單移除；已使用該標籤的交易不受影響，再次使用時會重新加入。',
    'settings.noTags': '尚無已儲存的標籤',
    'settings.restoreCategory': '還原分類',
    'settings.expenseCategories': '支出',
    'settings.incomeCategories': '收入',
    'settings.transferCategories': '移轉',
    'settings.addCategory': '新增分類',
    'settings.categoryPlaceholder': '輸入分類名稱',

    // Validation
    'validation.modalTitle': '資料驗算報告',
    'validation.fixAll': '全部修復',
    'validation.fix': '修復',
    'validation.remapTo': '改指向',
    'validation.frontmatterSection': 'Frontmatter 快取不一致',
    'validation.frontmatterDesc': '{month}：收入應為 {actualIncome}（現為 {storedIncome}），支出應為 {actualExpense}（現為 {storedExpense}）',
    'validation.orphanSection': '孤兒帳戶引用',
    'validation.orphanDesc': '帳戶「{wallet}」不存在於設定中，共 {count} 筆交易引用（{months}）',
    'validation.repaired': '已修復 {count} 個問題',
    'settings.autoValidate': '啟動時自動驗算',
    'settings.autoValidateDesc': '開啟 Obsidian 時自動掃描所有資料，偵測 frontmatter 快取不一致與孤兒帳戶',
    'notice.validationClean': '驗算完成，資料無誤。',

    // Confirm dialogs
    'confirm.deleteTransaction': '確定要刪除這筆交易？此操作無法復原。',
    'confirm.archiveWallet': '確定要封存此錢包？封存後無法復原，該錢包將不再出現在交易入口中。',
    'confirm.deleteWallet': '確定要刪除此錢包？',
    'confirm.unarchiveWallet': '確定要取消封存此錢包？',

    // Onboarding
    'onboard.welcome': '歡迎使用 Finance Tracker！建議先新增您的銀行帳戶與信用卡錢包。',

    // Settings — extra
    'settings.noActiveWallets': '無使用中錢包',
    'settings.creditDebtPrefix': '欠 ',
    'settings.creditBalanceHint': '信用卡填入目前未還金額（正數）。例：欠 3,000 → 填 3000',
    'settings.cashBankBalanceHint': '填入目前實際餘額（需 ≥ 0）',

    // Notices
    'notice.walletAdded': '✓ 帳戶「{name}」已新增',
    'notice.walletReordered': '✓ 帳戶順序已儲存',
    'notice.transactionDeleted': '✓ 交易已刪除',
    'notice.transactionAdded': '✓ 交易已新增',
    'notice.transactionUpdated': '✓ 交易已更新',
    'notice.loadFailed': 'Finance Tracker 載入失敗，請檢查插件設定。',

    // Errors — extra
    'err.cashBankNegativeBalance': '現金與銀行帳戶餘額不能為負數',
    'err.creditNegativeBalance': '信用卡未還金額不能為負數，請填正數欠款金額',
    'err.creditNegativeBalanceShort': '信用卡未還金額請填正數',
    'err.categoryExists': '分類已存在',
    'err.categoryExistsInOtherList': '此分類名稱已存在於另一個清單中',
    'err.invalidDate': '日期格式無效',
    'err.fromMustNotBeCreditCard': '轉出帳戶不能是信用卡',
    'err.toMustBeCreditCard': '轉入帳戶必須是信用卡',

    'ui.unarchive': '取消封存',

    // Header tabs
    'ui.overview': '總覽',

    // Budgets
    'modal.budget': '預算',
    'dash.budgets': '預算',
    'dash.budgetSpentOf': '{spent} / {amount}',
    'dash.budgetRemaining': '剩餘 {amount}',
    'dash.budgetOver': '超支 {amount}',
    'detail.budgetFilter': '預算：{name}',
    'embed.unknownBudget': '找不到預算「{name}」',
    'embed.noBudgetName': '請在 finance-budget 區塊內寫上預算名稱',
    'embed.openBudget': '顯示{name}的交易',
    'embed.noFollowUpTag': '請在 finance-followups 區塊內寫上標籤，或在設定中填寫待追蹤標籤',
    'detail.tagFilter': '標籤：#{name}',
    'settings.budgets': '預算',
    'settings.budgetsDesc': '設定每月預算金額。支出交易可指定預算，每月從預算金額中扣除，次月重新計算。',
    'settings.noBudgets': '尚未建立預算',
    'settings.budgetName': '名稱',
    'settings.budgetAmount': '每月金額',
    'settings.addBudget': '新增預算',
    'err.budgetNameEmpty': '請輸入預算名稱',
    'err.budgetNameInvalid': '預算名稱不能包含「|」',
    'err.budgetNameDuplicate': '預算名稱已存在',
    'err.budgetAmountInvalid': '預算金額必須是 0 或正數',
    'confirm.deleteBudget': '確定要刪除此預算？已指定此預算的交易會保留原本的預算名稱。',
    'notice.budgetAdded': '已新增預算「{name}」',
    'ui.budgets': '預算',
    'budget.title': '預算',
    'budget.empty': '尚未建立預算。到設定中新增每月預算，再於支出交易指定預算。',
    'budget.openSettings': '開啟設定',
    'budget.totalBudgeted': '預算總額',
    'budget.totalSpent': '已支出',
    'budget.totalRemaining': '剩餘',
    'budget.totalOver': '超支',
    'budget.percentUsed': '已使用 {pct}%',
    'budget.perDay': '剩餘 {days} 天，每天約 {amount}',
    'budget.todayMarker': '今天',
    'budget.noTransactions': '本月尚無交易',
    'budget.viewAll': '查看全部 {count} 筆交易',
    'budget.unbudgeted': '未指定預算的支出',
    'budget.unbudgetedDesc': '{count} 筆支出未指定預算',
    // Subscriptions and bills
    'label.freq.monthly': '每月',
    'label.freq.quarterly': '每季',
    'label.freq.yearly': '每年',
    'settings.subscriptions': '訂閱與定期帳單',
    'settings.subscriptionsDesc': '定期帳單會在扣款日由執行背景工作的裝置自動記為支出，並在到期前幾天顯示在總覽。',
    'settings.noSubscriptions': '尚未建立訂閱',
    'settings.addSubscription': '新增訂閱',
    'settings.subscriptionsTotal': '合計約每月 {amount}',
    'settings.subscriptionNext': '下次扣款 {date}',
    'settings.subscriptionManual': '手動記帳',
    'settings.billReminderDays': '提前提醒天數',
    'settings.billReminderDaysDesc': '帳單在扣款日前幾天開始顯示在總覽。',
    'sub.perMonthly': '每月 {amount}',
    'sub.perQuarterly': '每季 {amount}',
    'sub.perYearly': '每年 {amount}',
    'sub.addTitle': '新增訂閱',
    'sub.editTitle': '編輯訂閱',
    'sub.name': '名稱',
    'sub.nameDesc': '也會作為每筆支出的備註。',
    'sub.namePlaceholder': '例如：電話費',
    'sub.frequency': '頻率',
    'sub.nextCharge': '下次扣款日',
    'sub.nextChargeDesc': '若日期已過，執行背景工作的裝置會在同步完成後記帳。',
    'sub.noBudget': '（無）',
    'sub.tagsPlaceholder': '以逗號分隔',
    'sub.autoRecord': '自動記帳',
    'sub.autoRecordDesc': '關閉時只會提醒，由你自行記帳。適合金額每次不同的帳單。',
    'err.subscriptionNameEmpty': '請輸入名稱',
    'err.subscriptionNameInvalid': '名稱不能包含「|」',
    'confirm.deleteSubscription': '刪除這個訂閱？已記錄的支出會保留。',
    'notice.subscriptionSaved': '已儲存訂閱「{name}」',
    'notice.subscriptionsRecorded': '已自動記錄定期帳單：',
    'dash.upcomingBills': '即將到期的帳單',
    'dash.billToday': '今天',
    'dash.billTomorrow': '明天',
    'dash.billInDays': '{days} 天後',
    'dash.billOverdueOne': '已逾期 1 天',
    'dash.billOverdue': '已逾期 {days} 天',
    'dash.billAuto': '自動記帳',
    'dash.billRecord': '記帳',
    'dash.billSkip': '略過',
    'dash.billManage': '管理',
    'settings.thisDevice': '這台裝置',
    'settings.thisDeviceDesc': '只有這台裝置會看到這個設定，不會同步。',
    'settings.backgroundTasks': '在這台裝置執行背景工作',
    'settings.backgroundTasksDesc': '自動記錄到期的訂閱。只在一台一直開著並同步的裝置上開啟，其他裝置都關閉，帳單就不會被記兩次。電腦預設開啟，手機和平板預設關閉。',
    'err.transactionChanged': '這筆交易已在其他裝置上變更。請重新開啟後再試一次。',
    'validation.duplicateSection': '可能重複的扣款',
    'validation.duplicateDesc': '{month}：「{name}」在 {date} 被記錄了 {count} 次。',
    'validation.duplicateHint': '不會自動刪除任何資料。請對照帳單明細，自行刪除多出來的那筆。',
    'validation.showInTransactions': '在交易明細中顯示',
    'dash.billNoneToday': '今天沒有到期的帳單。',
    'dash.billNoneTomorrow': '今明兩天沒有到期的帳單。',
    'dash.billNoneDays': '未來 {days} 天沒有到期的帳單。',
    'dash.billNext': '下一筆：{name}，{date} · {amount}',
    'dash.billNextAfter': '再下一筆：{name}，{date}',
  },
  'en': {
    'label.type.expense': 'Expense',
    'label.type.income': 'Income',
    'label.type.transfer': 'Transfer',

    'label.walletType.cash': 'Cash',
    'label.walletType.bank': 'Bank Account',
    'label.walletType.creditCard': 'Credit Card',

    'label.cat.food': 'Food',
    'label.cat.clothing': 'Clothing',
    'label.cat.housing': 'Home',
    'label.cat.transport': 'Transport',
    'label.cat.education': 'Education',
    'label.cat.entertainment': 'Entertainment',
    'label.cat.shopping': 'Shopping',
    'label.cat.medical': 'Medical',
    'label.cat.cash_expense': 'Cash Expense',
    'label.cat.insurance': 'Insurance',
    'label.cat.fees': 'Fees',
    'label.cat.tax': 'Tax',

    'label.cat.salary': 'Salary',
    'label.cat.interest': 'Interest',
    'label.cat.side_income': 'Side Income',
    'label.cat.bonus': 'Bonus',
    'label.cat.lottery': 'Lottery',
    'label.cat.rent': 'Rent',
    'label.cat.cashback': 'Cashback',
    'label.cat.dividend': 'Dividend',
    'label.cat.investment_profit': 'Investment Profit',
    'label.cat.insurance_income': 'Insurance Claim',
    'label.cat.pension': 'Pension',

    'label.cat.account_transfer': 'Account Transfer',
    'label.cat.credit_card_payment': 'Credit Card Payment',
    'label.cat.investment_trade': 'Investment Trade',

    'label.cat.uncategorized': 'Uncategorized',
    'label.cat.other': 'Other',

    'ui.addTransaction': 'Add transaction',
    'ui.detail': 'Transactions',
    'ui.confirm': 'Confirm',
    'ui.cancel': 'Cancel',
    'ui.delete': 'Delete',
    'ui.edit': 'Edit',
    'ui.archive': 'Archive',
    'ui.save': 'Save',
    'ui.search': 'Search',
    'ui.noMatches': 'No matches',

    'dashboard.title': 'Finance overview',
    'dash.income': 'Income',
    'dash.expense': 'Expense',
    'dash.balance': 'Balance',
    'dash.netAsset': 'Net assets',
    'dash.walletBalances': 'Account balances',
    'dash.assetAllocation': 'Asset allocation',
    'dash.expenseByCategory': 'Expense by category',
    'dash.expenseByTag': 'Expenses by tag',
    'dash.untagged': 'Untagged',
    'dash.followUps': 'Follow-ups',
    'dash.noFollowUps': 'No transactions tagged #{tag}',
    'settings.followUpTag': 'Follow-up tag',
    'settings.followUpTagPlaceholder': 'e.g. follow_up',
    'settings.followUpTagDesc': 'The overview\'s follow-ups card lists every transaction with this tag, from any month. Leave empty to hide the card.',
    'settings.chartExcludedTags': 'Tags hidden from the tag chart',
    'settings.chartExcludedTagsDesc': 'Comma-separated tags that the expenses-by-tag chart ignores. Expenses with only these tags count as untagged.',
    'settings.chartExcludedTagsPlaceholder': 'e.g. follow_up, reimbursable',
    'dash.noData': 'No data this month',

    'detail.title': 'Transactions',
    'detail.filterAll': 'All',
    'detail.filterExpense': 'Expense',
    'detail.filterIncome': 'Income',
    'detail.filterTransfer': 'Transfer',
    'detail.subtotalIncome': 'Income subtotal',
    'detail.subtotalExpense': 'Expense subtotal',
    'detail.noTransactions': 'No matching transactions',
    'detail.searchPlaceholder': 'Search notes/tags...',
    'detail.filterCategory': 'Category',
    'detail.filterButton': 'Filter',
    'detail.filterTitle': 'Filter',
    'detail.filterType': 'Type',
    'detail.filterAccount': 'Account',
    'detail.filterAllAccounts': 'All accounts',
    'detail.filterDateRange': 'Date range',
    'detail.filterClearAll': 'Clear all',
    'detail.filterDone': 'Done',

    'trend.monthlyExpense': 'Monthly expenses',

    'date.yearMonthNumeric': '{month}/{year}',
    'date.yearMonthShort': '{monthName} {year}',
    'date.monthLabel': '{monthName}',

    'modal.addTitle': 'Add transaction',
    'modal.editTitle': 'Edit transaction',
    'modal.date': 'Date',
    'modal.wallet': 'Account',
    'modal.fromWallet': 'From account',
    'modal.toWallet': 'To account',
    'modal.category': 'Category',
    'modal.note': 'Note',
    'modal.tags': 'Tags',
    'modal.tagsPlaceholder': 'Type and press Enter',
    'modal.done': 'Done',
    'tagPicker.title': 'Select tags',
    'tagPicker.search': 'Search or type a new tag',
    'tagPicker.addTag': '+ Add tag',
    'tagPicker.addNamed': '+ Add "{name}"',
    'tagPicker.noResults': 'No tags containing "{searchTerm}"',
    'tagPicker.tagLimit': 'Tag limit reached',
    'tagPicker.tooLong': 'Too long to add (max 5 CJK / 30 ASCII chars)',
    'tagPicker.rowPlaceholder': 'Select tags',
    'modal.amount': 'Amount',

    'err.amountRequired': 'Amount is required',
    'err.amountPositive': 'Amount must be greater than 0',
    'err.amountInteger': 'Decimal amounts are not allowed. Please enter a whole number.',
    'err.walletRequired': 'Please select an account',
    'err.fromWalletRequired': 'Please select source account',
    'err.toWalletRequired': 'Please select target account',
    'err.sameWallet': 'Source and target accounts cannot be the same',
    'err.walletNameEmpty': 'Account name cannot be empty',
    'err.walletNameDuplicate': 'Account name already exists',
    'calculator.err.pendingExpression': 'Press = to finish the calculation',
    'calculator.err.negativeResult': 'Calculation result cannot be negative',
    'calculator.err.divideByZero': 'Cannot divide by 0',
    'calculator.done': 'Done',

    'settings.general': 'General',
    'settings.folderName': 'Folder name',
    'settings.folderNameDesc': 'Folder to store penny-wallet files (relative to vault root)',
    'settings.defaultWallet': 'Default account',
    'settings.defaultWalletDesc': 'Account that new expenses and income are recorded against',
    'settings.decimalPlaces': 'Decimal places',
    'settings.decimalPlacesDesc': 'Number of decimal places allowed for amounts',
    'settings.dp0': 'Integer (0 decimals)',
    'settings.dp2': '2 decimal places',
    'settings.activeWallets': 'Active accounts',
    'settings.archivedWallets': 'Archived accounts',
    'settings.addWallet': 'Add account',
    'settings.walletName': 'Name',
    'settings.walletType': 'Type',
    'settings.initialBalance': 'Initial balance',
    'settings.includeInNetAssetOn': 'Current: included in net assets',
    'settings.includeInNetAssetOff': 'Current: excluded from net assets',
    'settings.customCategories': 'Categories',
    'settings.categoriesDesc': 'Remove a built-in category with × (you can restore it later from the removed list). Transactions that already use it are not changed.',
    'settings.removedCategories': 'Removed:',
    'settings.tags': 'Tags',
    'settings.tagsDesc': 'Tags suggested when adding a transaction. Remove one with ×; transactions that use it keep it, and using it again adds it back.',
    'settings.noTags': 'No saved tags yet',
    'settings.restoreCategory': 'Restore category',
    'settings.expenseCategories': 'Expense',
    'settings.incomeCategories': 'Income',
    'settings.transferCategories': 'Transfer',
    'settings.addCategory': 'Add category',
    'settings.categoryPlaceholder': 'Enter category name',

    // Validation
    'validation.modalTitle': 'Data validation report',
    'validation.fixAll': 'Fix all',
    'validation.fix': 'Fix',
    'validation.remapTo': 'Remap to',
    'validation.frontmatterSection': 'Frontmatter cache mismatch',
    'validation.frontmatterDesc': '{month}: income should be {actualIncome} (stored: {storedIncome}), expense should be {actualExpense} (stored: {storedExpense})',
    'validation.orphanSection': 'Orphaned wallet references',
    'validation.orphanDesc': 'Wallet "{wallet}" not found in config — {count} transaction(s) affected ({months})',
    'validation.repaired': 'Fixed {count} issue(s)',
    'settings.autoValidate': 'Validate data on startup',
    'settings.autoValidateDesc': 'Scan all data when Obsidian loads to detect frontmatter mismatches and orphaned wallet references',
    'notice.validationClean': 'Validation complete — data looks good.',

    'confirm.deleteTransaction': 'Delete this transaction? This cannot be undone.',
    'confirm.archiveWallet': 'Archive this wallet? This cannot be undone. The wallet will no longer appear in transaction forms.',
    'confirm.deleteWallet': 'Delete this wallet?',
    'confirm.unarchiveWallet': 'Unarchive this wallet?',

    'onboard.welcome': 'Welcome to Finance Tracker! We recommend adding your bank accounts and credit cards.',

    'settings.noActiveWallets': 'No active wallets',
    'settings.creditDebtPrefix': 'Owed ',
    'settings.creditBalanceHint': 'Enter current outstanding debt (positive). e.g. owe 3,000 → enter 3000',
    'settings.cashBankBalanceHint': 'Enter current actual balance (must be ≥ 0)',

    'notice.walletAdded': '✓ Account "{name}" added',
    'notice.walletReordered': '✓ Wallet order saved',
    'notice.transactionDeleted': '✓ Transaction deleted',
    'notice.transactionAdded': '✓ Transaction added',
    'notice.transactionUpdated': '✓ Transaction updated',
    'notice.loadFailed': 'Finance Tracker failed to load. Please check plugin settings.',

    'err.cashBankNegativeBalance': 'Cash and bank balance cannot be negative',
    'err.creditNegativeBalance': 'Credit card balance cannot be negative, enter positive debt amount',
    'err.creditNegativeBalanceShort': 'Enter positive amount for credit card debt',
    'err.categoryExists': 'Category already exists',
    'err.categoryExistsInOtherList': 'This category already exists in the other list',
    'err.invalidDate': 'Invalid date',
    'err.fromMustNotBeCreditCard': 'Source account cannot be a credit card',
    'err.toMustBeCreditCard': 'Target account must be a credit card',

    'ui.unarchive': 'Unarchive',

    // Header tabs
    'ui.overview': 'Overview',

    // Budgets
    'modal.budget': 'Budget',
    'dash.budgets': 'Budgets',
    'dash.budgetSpentOf': '{spent} of {amount}',
    'dash.budgetRemaining': '{amount} left',
    'dash.budgetOver': '{amount} over',
    'detail.budgetFilter': 'Budget: {name}',
    'embed.unknownBudget': 'No budget named "{name}"',
    'embed.noBudgetName': 'Write a budget name inside the finance-budget block',
    'embed.openBudget': 'Show {name} transactions',
    'embed.noFollowUpTag': 'Write a tag inside the finance-followups block, or set a follow-up tag in settings',
    'detail.tagFilter': 'Tag: #{name}',
    'settings.budgets': 'Budgets',
    'settings.budgetsDesc': 'Set a monthly amount for each budget. Expense transactions assigned to a budget are deducted from it; budgets reset every month.',
    'settings.noBudgets': 'No budgets yet',
    'settings.budgetName': 'Name',
    'settings.budgetAmount': 'Monthly amount',
    'settings.addBudget': 'Add budget',
    'err.budgetNameEmpty': 'Enter a budget name',
    'err.budgetNameInvalid': 'Budget names cannot contain "|"',
    'err.budgetNameDuplicate': 'A budget with this name already exists',
    'err.budgetAmountInvalid': 'Budget amount must be 0 or more',
    'confirm.deleteBudget': 'Delete this budget? Transactions assigned to it keep the budget name.',
    'notice.budgetAdded': 'Budget "{name}" added',
    'ui.budgets': 'Budgets',
    'budget.title': 'Budgets',
    'budget.empty': 'No budgets yet. Add monthly budgets in the plugin settings, then assign expenses to them.',
    'budget.openSettings': 'Open settings',
    'budget.totalBudgeted': 'Budgeted',
    'budget.totalSpent': 'Spent',
    'budget.totalRemaining': 'Left',
    'budget.totalOver': 'Over budget',
    'budget.percentUsed': '{pct}% used',
    'budget.perDay': '≈ {amount}/day for the {days} days left',
    'budget.todayMarker': 'Today',
    'budget.noTransactions': 'No transactions this month',
    'budget.viewAll': 'View all {count} transactions',
    'budget.unbudgeted': 'Unbudgeted expenses',
    'budget.unbudgetedDesc': '{count} expense(s) without a budget',
    // Subscriptions and bills
    'label.freq.monthly': 'Monthly',
    'label.freq.quarterly': 'Every 3 months',
    'label.freq.yearly': 'Yearly',
    'settings.subscriptions': 'Subscriptions and bills',
    'settings.subscriptionsDesc': 'Recurring bills are recorded as expenses on their charge dates by the device that runs background tasks, and show on the overview a few days before they are due.',
    'settings.noSubscriptions': 'No subscriptions yet',
    'settings.addSubscription': 'Add subscription',
    'settings.subscriptionsTotal': 'About {amount} a month in total',
    'settings.subscriptionNext': 'Next charge {date}',
    'settings.subscriptionManual': 'Recorded by hand',
    'settings.billReminderDays': 'Days of notice',
    'settings.billReminderDaysDesc': 'How many days before a charge it starts showing on the overview.',
    'sub.perMonthly': '{amount} a month',
    'sub.perQuarterly': '{amount} every 3 months',
    'sub.perYearly': '{amount} a year',
    'sub.addTitle': 'Add subscription',
    'sub.editTitle': 'Edit subscription',
    'sub.name': 'Name',
    'sub.nameDesc': 'Also the note on each recorded expense.',
    'sub.namePlaceholder': 'e.g. phone bill',
    'sub.frequency': 'How often',
    'sub.nextCharge': 'Next charge',
    'sub.nextChargeDesc': 'If this date has already passed, the device that runs background tasks records it once syncing has caught up.',
    'sub.noBudget': '(None)',
    'sub.tagsPlaceholder': 'Comma-separated',
    'sub.autoRecord': 'Record automatically',
    'sub.autoRecordDesc': 'When off, you are only reminded and record it yourself. Handy for bills whose amount changes.',
    'err.subscriptionNameEmpty': 'Enter a name',
    'err.subscriptionNameInvalid': 'Names cannot contain "|"',
    'confirm.deleteSubscription': 'Delete this subscription? Expenses already recorded are kept.',
    'notice.subscriptionSaved': 'Subscription "{name}" saved',
    'notice.subscriptionsRecorded': 'Recorded recurring bills:',
    'dash.upcomingBills': 'Upcoming bills',
    'dash.billToday': 'Today',
    'dash.billTomorrow': 'Tomorrow',
    'dash.billInDays': 'In {days} days',
    'dash.billOverdueOne': '1 day overdue',
    'dash.billOverdue': '{days} days overdue',
    'dash.billAuto': 'Automatic',
    'dash.billRecord': 'Record',
    'dash.billSkip': 'Skip',
    'dash.billManage': 'Manage',
    'settings.thisDevice': 'This device',
    'settings.thisDeviceDesc': 'Only this device sees this setting. It isn\'t synced.',
    'settings.backgroundTasks': 'Run background tasks on this device',
    'settings.backgroundTasksDesc': 'Records due subscriptions automatically. Turn it on for one device that is always open and syncing, and off everywhere else, so a charge can\'t be recorded twice. On by default on a computer, off on a phone or tablet.',
    'err.transactionChanged': 'This transaction changed on another device. Reopen it and try again.',
    'validation.duplicateSection': 'Possible duplicate charges',
    'validation.duplicateDesc': '{month}: "{name}" was recorded {count} times on {date}.',
    'validation.duplicateHint': 'Nothing is deleted for you. Check against your statement and delete the extra one yourself.',
    'validation.showInTransactions': 'Show in transactions',
    'dash.billNoneToday': 'Nothing due today.',
    'dash.billNoneTomorrow': 'Nothing due today or tomorrow.',
    'dash.billNoneDays': 'Nothing due in the next {days} days.',
    'dash.billNext': 'Next: {name} on {date} · {amount}',
    'dash.billNextAfter': 'Next after that: {name} on {date}',
  },
} as const

type TranslationKey = keyof typeof translations['en']

let currentLocale: Locale = 'zh-TW'

const LOCALE_TAGS: Record<Locale, string> = {
  'zh-TW': 'zh-TW',
  en: 'en-US',
}

export function detectLocale(): Locale {
  try {
    // Obsidian exposes moment with locale set
    const lang = (window as Window & { moment?: { locale?: () => string } }).moment?.locale?.() ?? ''
    if (lang.startsWith('zh')) return 'zh-TW'
  } catch {
    // ignore
  }
  return 'en'
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function t(key: TranslationKey): string {
  const dict = translations[currentLocale] as Record<string, string>
  return dict[key] ?? (translations['en'] as Record<string, string>)[key] ?? key
}

/** t() with variable substitution. e.g. tn('notice.walletAdded', { name: '現金' }) */
export function tn(key: TranslationKey, vars: Record<string, string>): string {
  let str = t(key)
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v)
  }
  return str
}

function parseYearMonth(yearMonth: string): { year: string; month: string; monthPadded: string; date: Date } | null {
  const match = yearMonth.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null

  const [, year, monthPadded] = match
  const monthNumber = Number(monthPadded)
  if (monthNumber < 1 || monthNumber > 12) return null

  return {
    year,
    month: String(monthNumber),
    monthPadded,
    date: new Date(Number(year), monthNumber - 1, 1),
  }
}

function getShortMonthName(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[currentLocale], { month: 'short' }).format(date)
}

export function formatYearMonth(yearMonth: string, style: 'numeric' | 'short' = 'numeric'): string {
  const parsed = parseYearMonth(yearMonth)
  if (!parsed) return yearMonth

  const vars = {
    year: parsed.year,
    month: parsed.month,
    monthPadded: parsed.monthPadded,
    monthName: getShortMonthName(parsed.date),
  }

  return style === 'short'
    ? tn('date.yearMonthShort', vars)
    : tn('date.yearMonthNumeric', vars)
}

export function formatMonthLabel(yearMonth: string): string {
  const parsed = parseYearMonth(yearMonth)
  if (!parsed) return yearMonth

  return tn('date.monthLabel', {
    year: parsed.year,
    month: parsed.month,
    monthPadded: parsed.monthPadded,
    monthName: getShortMonthName(parsed.date),
  })
}

/** "Dec 17" (en) / "12月17日" (zh-TW) from "yyyy-mm-dd". */
export function formatMonthDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Intl.DateTimeFormat(LOCALE_TAGS[currentLocale], { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

/** Translate a category value from markdown (key or raw string) to display label */
export function translateCategory(value: string): string {
  if (!value || value === '-') return t('label.cat.uncategorized')
  const key = `label.cat.${value}` as TranslationKey
  const dict = translations[currentLocale] as Record<string, string>
  return dict[key] ?? value  // custom categories return as-is
}

export function initI18n(): void {
  currentLocale = detectLocale()
}
