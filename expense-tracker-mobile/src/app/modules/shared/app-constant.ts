
export class AppConstant {
    public static readonly DEBUG = true;

    public static readonly BASE_URL = "";
    public static readonly BASE_API_URL = `${AppConstant.BASE_URL}api/ApiMobile/`;
    public static readonly DB_NAME = "et.db";

    public static readonly DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
    public static readonly DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
    public static readonly DEFAULT_TIME_FORMAT = "HH:mm";
    
    public static readonly EVENT_DB_INITIALIZED = "event:dbInitialized"; 
    public static readonly EVENT_EXPENSE_CREATED_OR_UPDATED = "event:expenseCreatedOrUpdated"; 

    public static readonly KEY_WORKING_LANGUAGE = "key:workingLanguage";

}