<?php require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/header.php"); ?>

<?php
 
global $USER;
if (!$USER->IsAdmin()) {
    echo "Авторизуйтесь!";
    return;
}
$deleteFiles = 'no'; //Удалять найденые файлы yes/no
$backupFiles = 'yes'; //Создавать бэкап файла yes/no


$time_start = microtime(true);

define("NO_KEEP_STATISTIC", true);
define("NOT_CHECK_PERMISSIONS", true);
 
$pathBackup = $_SERVER['DOCUMENT_ROOT'] . "/backup/"; //Папка бэкапа

$imgPath = $_SERVER['DOCUMENT_ROOT'] . "/upload/iblock"; //Папка для поиска изображений


if (!file_exists($pathBackup)) {
    CheckDirPath($pathBackup);
}
 
// Делаем кеш из таблицы b_file
$arFilesCache = array();
$result = $DB->Query('SELECT FILE_NAME, SUBDIR FROM b_file WHERE MODULE_ID = "iblock"');
while ($row = $result->Fetch()) {
    $arFilesCache[$row['FILE_NAME']] = $row['SUBDIR'];
}
 
$hRootDir = opendir($imgPath);
$count = 0;
$countDir = 0;  //Счётчик поддиректорий
$countFile = 0;  //Счётчик всех файлов
$i = 1;
$removeFile=0; //Счётчик удаленных файлов
while (false !== ($subDirName = readdir($hRootDir))) {
    if ($subDirName == '.' || $subDirName == '..') {
        continue;
    }
    
    $filesCount = 0;   //Счётчик пройденых файлов
    $subDirPath = "$imgPath/$subDirName"; //Путь до подкатегорий с файлами
    $hSubDir = opendir($subDirPath);
    
    while (false !== ($fileName = readdir($hSubDir))) {
        if ($fileName == '.' || $fileName == '..') {
            continue;
        }
        $countFile++;
 
        if (array_key_exists($fileName, $arFilesCache)) { //Файл с диска есть в списке файлов базы - пропуск
            $filesCount++;
            continue;
        }
        $fullPath = "$subDirPath/$fileName"; // полный путь до файла
        $backTrue = false; //для создание бэкапа
        if ($deleteFiles === 'yes') {
			if ($backupFiles === 'yes') {
				if (!file_exists($pathBackup . $subDirName)) {
					if (CheckDirPath($pathBackup . $subDirName . '/')) { //создал поддиректорию
						$backTrue = true;
					}
				} else {
					$backTrue = true;
				}
				if ($backTrue) {
						CopyDirFiles($fullPath, $pathBackup . $subDirName . '/' . $fileName); //копия в бэкап
				}
			}
            //Удаление файла
            if (unlink($fullPath)) {
                $removeFile++;
                echo "Удалил: " . $fullPath . '<br>';
            }
        } else {
            $filesCount++;
            echo 'Кандидат на удаление - ' . $i . ') ' . $fullPath . '<br>';
        }
        $i++;
        $count++;
        unset($fileName, $backTrue);
    }
    closedir($hSubDir);
    //Удалить поддиректорию, если удаление активно и счётчик файлов пустой - т.е каталог пуст
    if ($deleteFiles && !$filesCount) {
        rmdir($subDirPath);
    }
    $countDir++;
}
if ($count < 1) {
    echo 'Не нашёл данных для удаления<br>';
}
 if ($backupFiles === 'yes') {
     echo 'Бекап с файлами лежит в : <b>' . $pathBackup . '</b><br>';
 }
echo 'Всего файлов удалили: <b>' . $removeFile . '</b><br>';
echo 'Всего файлов в ' . $imgPath . ': <b>' . $countFile . '</b><br>';
echo 'Всего подкаталогов в ' . $imgPath . ': <b>' . $countDir . '</b><br>';
echo 'Всего записей в b_file: <b>' . count($arFilesCache) . '</b><br>';
closedir($hRootDir);
 

echo '<br>';
$time_end = microtime(true);
$time = $time_end - $time_start;
 
echo "Время выполнения $time секунд\n";
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");
?>
