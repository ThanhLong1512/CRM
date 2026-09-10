export type SupportedLanguage = "vi" | "en" | "zh" | "ja";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Tiếng Việt", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "Tiếng Anh", nativeLabel: "English", flag: "🇬🇧" },
  { code: "zh", label: "Tiếng Trung", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "ja", label: "Tiếng Nhật", nativeLabel: "日本語", flag: "🇯🇵" },
];

export const translations = {
  vi: {
    // Brand & App
    appName: "Remix Petro",
    appSubtitle: "Hệ thống Phân phối Dầu nhớt",
    branchName: "Chi nhánh Phía Nam",
    version: "v2.6 Pro",
    centralWarehouse: "Kho Tổng Bình Chánh",
    warehouseStatusReady: "Sẵn sàng",
    warehouseAddress: "QL1A, H. Bình Chánh, TP.HCM",
    technicalHotline: "Hotline Kỹ thuật",

    // Navigation Groups
    navOverview: "TỔNG QUAN",
    navSalesField: "KINH DOANH & THỰC ĐỊA",
    navInventoryWarehouse: "KHO & HÀNG HÓA",
    navSystem: "HỆ THỐNG",

    // Navigation Modules
    modDashboard: "Dashboard & RFM",
    modCustomers: "Khách Hàng & Công Nợ",
    modOrders: "Đơn Hàng & Kanban",
    modFleet: "Đội Xe & Bảo Dưỡng",
    modSalesPwa: "Tuyến Sales & GPS",
    modLoyaltyQr: "Tích Điểm Thợ Máy",
    modProducts: "Master Data Sản Phẩm",
    modDrums: "Quản Lý Vỏ Phuy 200L",
    modStaffRbac: "Nhân Sự & Phân Quyền",
    modSettings: "Cấu Hình Hệ Thống",

    // Module Page Titles
    titleDashboard: "Tổng Quan & Phân Tích RFM",
    titleProducts: "Quản Lý Sản Phẩm (Master Data)",
    titleCustomers: "Khách Hàng & Hạn Mức Công Nợ",
    titleSalesPwa: "Tuyến Sales & Check-in GPS",
    titleFleet: "Quản Trị Đội Xe & Bảo Dưỡng",
    titleLoyaltyQr: "Trạm Quét QR Tích Điểm Thợ Máy",
    titleDrums: "Quản Lý Luân Chuyển Vỏ Phuy 200L",
    titleKanban: "Đơn Hàng & Kanban Kế Toán",
    titleStaffRbac: "Nhân Sự Sales & Phân Quyền RBAC",
    titleSettings: "Cấu Hình & Tham Số Nghiệp Vụ",

    // Header & Actions
    quickActions: "Thao tác nhanh",
    quickActionMenuTitle: "Mở danh mục thao tác nhanh toàn hệ thống",
    networkOnline: "Online",
    networkOffline: "Offline",
    pendingSync: "Chờ sync:",
    userAccount: "Tài khoản",
    profileAndLogout: "Hồ sơ & đăng xuất",
    loggingOut: "Đang đăng xuất...",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",

    // Quick Action Items
    qaSalesPwa: "Lên đơn bán hàng (Sales PWA)",
    qaKanban: "Bàn điều phối Kanban",
    qaCustomers: "Quản lý khách hàng & nợ",
    qaProducts: "Kho sản phẩm dầu nhớt",
    qaFleet: "Quản trị đội xe & chu kỳ",
    qaLoyalty: "Trạm tích điểm QR thợ",
    qaDrums: "Quản lý vỏ phuy 200L",
    qaDashboard: "Tổng quan Dashboard & RFM",

    // Mobile Bottom Nav
    bottomNavOverview: "Tổng quan",
    bottomNavCustomers: "Khách hàng",
    bottomNavOrderNow: "Lên đơn",
    bottomNavOrders: "Đơn hàng",
    bottomNavMore: "Thêm",

    // Theme & Display
    themeTitle: "Giao diện",
    themeLight: "Sáng",
    themeDark: "Tối",
    themeSystem: "Tự động",
    themeModeLight: "Chế độ Sáng",
    themeModeDark: "Chế độ Tối",
    themeModeSystem: "Theo hệ điều hành",
    themeCurrent: "Giao diện hiện tại:",

    // Language & Localization
    languageTitle: "Ngôn ngữ",
    languageSelect: "Chọn ngôn ngữ",
    languageCurrent: "Ngôn ngữ:",

    // Common Buttons & Labels
    btnSave: "Lưu thay đổi",
    btnCancel: "Hủy",
    btnConfirm: "Xác nhận",
    btnDelete: "Xóa",
    btnEdit: "Chỉnh sửa",
    btnAdd: "Thêm mới",
    btnClose: "Đóng",
    btnReset: "Khôi phục mặc định",
    btnSearch: "Tìm kiếm...",
    btnExportExcel: "Xuất Excel",
    btnFilter: "Bộ lọc",
    btnRefresh: "Tải lại",
    btnBack: "Quay lại",
    btnActive: "Đang dùng",

    // Statuses
    statusActive: "Hoạt động",
    statusPending: "Chờ duyệt",
    statusCompleted: "Hoàn tất",
    statusCancelled: "Đã hủy",
    statusUrgent: "Khẩn cấp",
    statusWarning: "Cảnh báo",
    statusSuccess: "Thành công",

    // KPI & Metrics
    kpiRevenueMtd: "Doanh Số MTD",
    kpiVolumeLiters: "Sản Lượng Lít",
    kpiOverdueDebt: "Nợ Quá Hạn",
    kpiEmptyDrums: "Vỏ Phuy Ngoài Tiệm",
    vsLastMonth: "so với tháng trước",
    noDataLastMonth: "Chưa có dữ liệu tháng trước",

    // User Profile Modal
    profileModalTitle: "Hồ Sơ Nhân Sự DMS",
    profileCode: "Mã:",
    profileDepartment: "Phòng ban",
    profileWarehouse: "Kho phụ trách",
    profileLoginTime: "Đăng nhập",
    profileCurrentSession: "Phiên hiện tại",
    profilePermissions: "Phân quyền vận hành",
    profileChangePassword: "Đổi Mật Khẩu",
    profileLogout: "Đăng Xuất",
    profilePreferences: "Tùy Chọn Cá Nhân",
    permApproveCredit: "Duyệt nợ khẩn cấp",
    permViewCostPrice: "Xem giá vốn",
    permCreateOrders: "Lên đơn hàng",
    permExportReports: "Xuất báo cáo",
    roleDirector: "Quản trị viên",
    roleAccountant: "Kế toán trưởng",
    roleSales: "Sales thực địa",
    // Chat nội bộ
    chatTitle: "Chat Nhóm Nội Bộ",
    chatMessages: "tin nhắn",
    chatNoMessages: "Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!",
    chatTypeMessage: "Nhập tin nhắn...",
    chatGroupHint: "Tin nhắn hiển thị cho toàn bộ nhóm · Enter để gửi",
  },

  en: {
    // Brand & App
    appName: "Remix Petro",
    appSubtitle: "Lubricants Distribution Management System",
    branchName: "Southern Branch",
    version: "v2.6 Pro",
    centralWarehouse: "Binh Chanh Central Hub",
    warehouseStatusReady: "Ready",
    warehouseAddress: "National Route 1A, Binh Chanh, HCMC",
    technicalHotline: "Tech Support Hotline",

    // Navigation Groups
    navOverview: "OVERVIEW",
    navSalesField: "SALES & FIELDWORK",
    navInventoryWarehouse: "INVENTORY & WAREHOUSE",
    navSystem: "SYSTEM",

    // Navigation Modules
    modDashboard: "Dashboard & RFM",
    modCustomers: "Customers & Receivables",
    modOrders: "Orders & Kanban",
    modFleet: "Fleet & Maintenance",
    modSalesPwa: "Sales Route & GPS",
    modLoyaltyQr: "Mechanic Loyalty QR",
    modProducts: "Products Master Data",
    modDrums: "200L Drum Management",
    modStaffRbac: "Staff & RBAC",
    modSettings: "System Settings",

    // Module Page Titles
    titleDashboard: "Executive Overview & RFM Analytics",
    titleProducts: "Product Catalog (Master Data)",
    titleCustomers: "Customers & Credit Limits",
    titleSalesPwa: "Field Sales Route & GPS Check-in",
    titleFleet: "Fleet Management & Maintenance Cycles",
    titleLoyaltyQr: "Mechanic Loyalty QR Reward Station",
    titleDrums: "200L Empty Drum Tracking & Deposits",
    titleKanban: "Order Dispatch & Accounting Kanban",
    titleStaffRbac: "Sales Personnel & RBAC Permissions",
    titleSettings: "Business Parameters & Configuration",

    // Header & Actions
    quickActions: "Quick Actions",
    quickActionMenuTitle: "Open global quick actions menu",
    networkOnline: "Online",
    networkOffline: "Offline",
    pendingSync: "Pending sync:",
    userAccount: "Account",
    profileAndLogout: "Profile & Logout",
    loggingOut: "Logging out...",
    openMenu: "Open menu",
    closeMenu: "Close menu",

    // Quick Action Items
    qaSalesPwa: "Create sales order (Sales PWA)",
    qaKanban: "Kanban dispatch board",
    qaCustomers: "Customer & credit management",
    qaProducts: "Lubricant products inventory",
    qaFleet: "Fleet & maintenance manager",
    qaLoyalty: "Mechanic QR rewards station",
    qaDrums: "200L drums balance manager",
    qaDashboard: "Executive Dashboard & RFM",

    // Mobile Bottom Nav
    bottomNavOverview: "Overview",
    bottomNavCustomers: "Customers",
    bottomNavOrderNow: "Order",
    bottomNavOrders: "Orders",
    bottomNavMore: "More",

    // Theme & Display
    themeTitle: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    themeModeLight: "Light Mode",
    themeModeDark: "Dark Mode",
    themeModeSystem: "System Preference",
    themeCurrent: "Current theme:",

    // Language & Localization
    languageTitle: "Language",
    languageSelect: "Select Language",
    languageCurrent: "Language:",

    // Common Buttons & Labels
    btnSave: "Save changes",
    btnCancel: "Cancel",
    btnConfirm: "Confirm",
    btnDelete: "Delete",
    btnEdit: "Edit",
    btnAdd: "Add New",
    btnClose: "Close",
    btnReset: "Restore defaults",
    btnSearch: "Search...",
    btnExportExcel: "Export Excel",
    btnFilter: "Filter",
    btnRefresh: "Refresh",
    btnBack: "Back",
    btnActive: "In Use",

    // Statuses
    statusActive: "Active",
    statusPending: "Pending",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    statusUrgent: "Urgent",
    statusWarning: "Warning",
    statusSuccess: "Success",

    // KPI & Metrics
    kpiRevenueMtd: "MTD Revenue",
    kpiVolumeLiters: "Volume (Liters)",
    kpiOverdueDebt: "Overdue Debt",
    kpiEmptyDrums: "Drums at Garages",
    vsLastMonth: "vs last month",
    noDataLastMonth: "No data from last month",

    // User Profile Modal
    profileModalTitle: "DMS Staff Profile",
    profileCode: "ID:",
    profileDepartment: "Department",
    profileWarehouse: "Assigned Hub",
    profileLoginTime: "Last Login",
    profileCurrentSession: "Current Session",
    profilePermissions: "Operational Permissions",
    profileChangePassword: "Change Password",
    profileLogout: "Logout",
    profilePreferences: "Personal Preferences",
    permApproveCredit: "Approve Credit",
    permViewCostPrice: "View Cost Price",
    permCreateOrders: "Create Orders",
    permExportReports: "Export Reports",
    roleDirector: "Administrator",
    roleAccountant: "Chief Accountant",
    roleSales: "Field Sales",
    // Chat
    chatTitle: "Team Group Chat",
    chatMessages: "messages",
    chatNoMessages: "No messages yet. Start the conversation!",
    chatTypeMessage: "Type a message...",
    chatGroupHint: "Messages visible to the whole team · Enter to send",
  },

  zh: {
    // Brand & App
    appName: "Remix 润滑油",
    appSubtitle: "润滑油供应链与分销管理系统",
    branchName: "南部配送中心",
    version: "v2.6 专业版",
    centralWarehouse: "平政总仓储中心",
    warehouseStatusReady: "运行就绪",
    warehouseAddress: "胡志明市平政县1A国道",
    technicalHotline: "技术支持服务热线",

    // Navigation Groups
    navOverview: "数据概览",
    navSalesField: "销售与外勤业务",
    navInventoryWarehouse: "库存与仓库管理",
    navSystem: "系统与设置",

    // Navigation Modules
    modDashboard: "仪表盘与RFM分析",
    modCustomers: "客户与信用账款",
    modOrders: "订单与看板协同",
    modFleet: "车队与维护周期",
    modSalesPwa: "销售路线与GPS打卡",
    modLoyaltyQr: "技师积分扫码站",
    modProducts: "油品主数据管理",
    modDrums: "200L大铁桶流转",
    modStaffRbac: "员工与权限控制",
    modSettings: "业务参数与配置",

    // Module Page Titles
    titleDashboard: "经营概况与客户RFM矩阵",
    titleProducts: "油品物料清单 (主数据)",
    titleCustomers: "客户档案与信用额度管控",
    titleSalesPwa: "外勤销售航线与GPS电子围栏",
    titleFleet: "运输车队管理与保养提醒",
    titleLoyaltyQr: "汽修技师扫码积分核销站",
    titleDrums: "200L空油桶流转与押金对账",
    titleKanban: "财务与物流看板协同台",
    titleStaffRbac: "销售团队与RBAC权限体系",
    titleSettings: "核心业务策略与全局参数",

    // Header & Actions
    quickActions: "快捷操作",
    quickActionMenuTitle: "开启系统级全局快捷通道",
    networkOnline: "在线",
    networkOffline: "离线",
    pendingSync: "待同步:",
    userAccount: "账号",
    profileAndLogout: "个人资料与登出",
    loggingOut: "正在退出系统...",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",

    // Quick Action Items
    qaSalesPwa: "现场销售下单 (PWA)",
    qaKanban: "看板调度台",
    qaCustomers: "客户与应收账款",
    qaProducts: "润滑油产品仓库",
    qaFleet: "车队保养管理",
    qaLoyalty: "技师扫码积分",
    qaDrums: "200L铁桶盘点",
    qaDashboard: "综合仪表盘",

    // Mobile Bottom Nav
    bottomNavOverview: "概览",
    bottomNavCustomers: "客户",
    bottomNavOrderNow: "下单",
    bottomNavOrders: "订单",
    bottomNavMore: "更多",

    // Theme & Display
    themeTitle: "主题外观",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    themeModeLight: "明亮模式",
    themeModeDark: "暗黑夜间模式",
    themeModeSystem: "跟随设备系统",
    themeCurrent: "当前主题:",

    // Language & Localization
    languageTitle: "系统语言",
    languageSelect: "选择显示语言",
    languageCurrent: "当前语言:",

    // Common Buttons & Labels
    btnSave: "保存更改",
    btnCancel: "取消",
    btnConfirm: "确认",
    btnDelete: "删除",
    btnEdit: "编辑",
    btnAdd: "新增",
    btnClose: "关闭",
    btnReset: "恢复默认值",
    btnSearch: "搜索关键字...",
    btnExportExcel: "导出Excel报表",
    btnFilter: "筛选条件",
    btnRefresh: "刷新数据",
    btnBack: "返回上页",
    btnActive: "使用中",

    // Statuses
    statusActive: "正常运转",
    statusPending: "待审核",
    statusCompleted: "已完成",
    statusCancelled: "已取消",
    statusUrgent: "紧急告警",
    statusWarning: "注意预警",
    statusSuccess: "操作成功",

    // KPI & Metrics
    kpiRevenueMtd: "本月累计销售额",
    kpiVolumeLiters: "累计出货升数",
    kpiOverdueDebt: "逾期应收账款",
    kpiEmptyDrums: "在外流通空桶",
    vsLastMonth: "环比上月",
    noDataLastMonth: "暂无上月历史对比数据",

    // User Profile Modal
    profileModalTitle: "DMS员工业务档案",
    profileCode: "工号:",
    profileDepartment: "所属部门",
    profileWarehouse: "负责仓库",
    profileLoginTime: "登录时间",
    profileCurrentSession: "当前在线会话",
    profilePermissions: "业务操作权限配置",
    profileChangePassword: "修改登录密码",
    profileLogout: "安全退出系统",
    profilePreferences: "个人界面与语言偏好",
    permApproveCredit: "特批超额授信",
    permViewCostPrice: "查看进货底价",
    permCreateOrders: "现场开单下单",
    permExportReports: "导出报表台账",
    roleDirector: "系统管理员",
    roleAccountant: "财务主管",
    roleSales: "一线销售",
    // 聊天
    chatTitle: "团队内部群聊",
    chatMessages: "条消息",
    chatNoMessages: "暂无消息，快来开启对话吧！",
    chatTypeMessage: "输入消息...",
    chatGroupHint: "消息对全员可见 · 按 Enter 发送",
  },

  ja: {
    // Brand & App
    appName: "Remix Petro",
    appSubtitle: "潤滑油流通管理・DMSシステム",
    branchName: "南部営業所",
    version: "v2.6 Pro",
    centralWarehouse: "ビンチャン総合配送センター",
    warehouseStatusReady: "稼働中",
    warehouseAddress: "ホーチミン市ビンチャン郡国道1A号線",
    technicalHotline: "テクニカルサポート窓口",

    // Navigation Groups
    navOverview: "概要・分析",
    navSalesField: "営業・フィールドワーク",
    navInventoryWarehouse: "在庫・物流管理",
    navSystem: "システム管理",

    // Navigation Modules
    modDashboard: "ダッシュボード & RFM",
    modCustomers: "取引先 & 売掛金管理",
    modOrders: "受注 & カンバン調達",
    modFleet: "車両フリート & 整備",
    modSalesPwa: "営業ルート & GPS打刻",
    modLoyaltyQr: "整備士QRポイント",
    modProducts: "製品マスターデータ",
    modDrums: "200Lドラム缶管理",
    modStaffRbac: "担当者 & RBAC権限",
    modSettings: "システム設定",

    // Module Page Titles
    titleDashboard: "経営ダッシュボード & RFM顧客分析",
    titleProducts: "潤滑油マスターデータ管理",
    titleCustomers: "取引先顧客台帳 & 与信限度額",
    titleSalesPwa: "外勤営業ルート & GPSジオフェンス",
    titleFleet: "車両管理 & オイル交換周期モニタ",
    titleLoyaltyQr: "整備士QRポイント還元ステーション",
    titleDrums: "200L空ドラム缶回収 & 保証金管理",
    titleKanban: "受注出荷カンバン & 経理連携",
    titleStaffRbac: "営業担当者 & RBACアクセス制御",
    titleSettings: "業務ルール & パラメータ設定",

    // Header & Actions
    quickActions: "クイック操作",
    quickActionMenuTitle: "システム共通クイックアクションを開く",
    networkOnline: "オンライン",
    networkOffline: "オフライン",
    pendingSync: "同期待ち:",
    userAccount: "アカウント",
    profileAndLogout: "プロフィール & ログアウト",
    loggingOut: "ログアウト中...",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",

    // Quick Action Items
    qaSalesPwa: "現場受注作成 (Sales PWA)",
    qaKanban: "カンバン配車・配送調整",
    qaCustomers: "取引先 & 売掛金管理",
    qaProducts: "潤滑油製品マスター",
    qaFleet: "フリート点検・保守",
    qaLoyalty: "整備士ポイント付与",
    qaDrums: "200Lドラム缶回収",
    qaDashboard: "総合ダッシュボード",

    // Mobile Bottom Nav
    bottomNavOverview: "概要",
    bottomNavCustomers: "取引先",
    bottomNavOrderNow: "発注",
    bottomNavOrders: "注文",
    bottomNavMore: "メニュー",

    // Theme & Display
    themeTitle: "テーマ設定",
    themeLight: "ライト",
    themeDark: "ダーク",
    themeSystem: "システム連動",
    themeModeLight: "ライトモード",
    themeModeDark: "ダークモード",
    themeModeSystem: "OSシステム設定に連動",
    themeCurrent: "現在のテーマ:",

    // Language & Localization
    languageTitle: "言語設定",
    languageSelect: "表示言語を選択",
    languageCurrent: "現在の言語:",

    // Common Buttons & Labels
    btnSave: "変更を保存",
    btnCancel: "キャンセル",
    btnConfirm: "確認",
    btnDelete: "削除",
    btnEdit: "編集",
    btnAdd: "新規追加",
    btnClose: "閉じる",
    btnReset: "初期値に戻す",
    btnSearch: "キーワード検索...",
    btnExportExcel: "Excel出力",
    btnFilter: "フィルター",
    btnRefresh: "再読み込み",
    btnBack: "戻る",
    btnActive: "使用中",

    // Statuses
    statusActive: "有効",
    statusPending: "承認待ち",
    statusCompleted: "完了",
    statusCancelled: "キャンセル",
    statusUrgent: "緊急",
    statusWarning: "注意",
    statusSuccess: "成功",

    // KPI & Metrics
    kpiRevenueMtd: "今月売上高 (MTD)",
    kpiVolumeLiters: "出荷数量 (リットル)",
    kpiOverdueDebt: "期限超過売掛金",
    kpiEmptyDrums: "整備工場未回収ドラム",
    vsLastMonth: "前月比",
    noDataLastMonth: "前月データなし",

    // User Profile Modal
    profileModalTitle: "DMSスタッフプロフィール",
    profileCode: "社員番号:",
    profileDepartment: "所属部署",
    profileWarehouse: "担当拠点",
    profileLoginTime: "ログイン日時",
    profileCurrentSession: "現在のセッション",
    profilePermissions: "業務権限設定",
    profileChangePassword: "パスワード変更",
    profileLogout: "ログアウト",
    profilePreferences: "個人設定 (テーマ・言語)",
    permApproveCredit: "与信緊急承認",
    permViewCostPrice: "仕入原価閲覧",
    permCreateOrders: "受注・発注作成",
    permExportReports: "レポート出力",
    roleDirector: "管理者",
    roleAccountant: "会計責任者",
    roleSales: "フィールド営業",
    // チャット
    chatTitle: "チーム社内グループチャット",
    chatMessages: "件のメッセージ",
    chatNoMessages: "メッセージはまだありません。会話を始めましょう！",
    chatTypeMessage: "メッセージを入力...",
    chatGroupHint: "メッセージは全員に表示されます · Enterで送信",
  },
} as const;

export type TranslationKey = keyof typeof translations.vi;
