export class AppConstant {
    public static readonly DEFAULT_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
    public static readonly DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
    public static readonly DEFAULT_TIME_FORMAT = "HH:mm";
    public static readonly DEFAULT_PASSWORD_SALT_ROUNDS = 10;

    public static readonly UPLOADED_PATH_FILES = "_uploaded";

    public static readonly UPLOADED_PATH_ML = "_ml";
    public static readonly UPLOADED_PATH_ML_WITH_FILE_NAME = `${AppConstant.UPLOADED_PATH_ML}/trained-net-category.json`;
}