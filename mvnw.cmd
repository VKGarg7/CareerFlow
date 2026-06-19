@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET "__MVNW_ARG0_NAME__=%~nx0")
@SET ___MVNW_INTS=
@SET ___MVNW_STRS=
@SET "___MVNW_COMMAND_LINE_ARGS=%*"

@SETLOCAL

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@SET MAVEN_WRAPPER_PROPERTIES_FILE=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties

@IF NOT EXIST "%MAVEN_WRAPPER_PROPERTIES_FILE%" (
  @ECHO "No .mvn\wrapper\maven-wrapper.properties file found in %MAVEN_PROJECTBASEDIR%"
  @EXIT /B 1
)

@FOR /F "usebackq tokens=1,2 delims==" %%a IN ("%MAVEN_WRAPPER_PROPERTIES_FILE%") DO (
  @IF "%%a"=="distributionUrl" SET "DISTRIBUTION_URL=%%b"
  @IF "%%a"=="wrapperUrl" SET "WRAPPER_URL=%%b"
)

@SET "MVN_DATA_DIR=%USERPROFILE%\.m2\wrapper"
@IF NOT EXIST "%MVN_DATA_DIR%" MKDIR "%MVN_DATA_DIR%"

@SET "DISTRIBUTION_FILENAME=%DISTRIBUTION_URL:*/=%"
@FOR /F "delims=" %%i IN ("%DISTRIBUTION_FILENAME%") DO SET "DISTRIBUTION_FILENAME=%%~nxi"

@SET "DISTRIBUTION_FOLDER=%MVN_DATA_DIR%\%DISTRIBUTION_FILENAME:.zip=%"

@IF NOT EXIST "%DISTRIBUTION_FOLDER%" (
  @ECHO "Downloading Apache Maven..."
  @powershell -Command "Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%MVN_DATA_DIR%\%DISTRIBUTION_FILENAME%'"
  @powershell -Command "Expand-Archive -Path '%MVN_DATA_DIR%\%DISTRIBUTION_FILENAME%' -DestinationPath '%MVN_DATA_DIR%' -Force"
)

@SET "MVN_CMD=%DISTRIBUTION_FOLDER%\bin\mvn.cmd"
@IF NOT EXIST "%MVN_CMD%" SET "MVN_CMD=%DISTRIBUTION_FOLDER%\bin\mvn"

"%MVN_CMD%" %___MVNW_COMMAND_LINE_ARGS%
