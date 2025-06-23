create table transcoding_sensor
(
    source                               text,
    "sourceDetectedValueTypeId"          text,
    "sourceDetectedValueTypeDescription" text,
    unit                                 text,
    "detectedValueTypeId"                text,
    "detectedValueTypeDescription"       text,
    yy                                   double precision,
    xx                                   double precision,
    zz                                   double precision
);

alter table transcoding_sensor
    owner to postgres;

create table view_data_original
(
    source                         text,
    "refStructureId"               text,
    "refStructureName"             text,
    "companyId"                    double precision,
    "companyName"                  text,
    "fieldId"                      double precision,
    "fieldName"                    text,
    "plantId"                      double precision,
    "plantName"                    text,
    sectorName                     text,
    plantRow                         text,
    colture                        text,
    "coltureType"                  text,
    "nodeId"                       text,
    "nodeDescription"              text,
    "detectedValueTypeId"          text,
    "detectedValueTypeDescription" text,
    yy                             double precision,
    xx                             double precision,
    value                          double precision,
    unit                           text,
    date                           timestamp,
    time                           text,
    latitude                       double precision,
    longitude                      double precision,
    timestamp                      integer,
    zz                             double precision
);

alter table view_data_original
    owner to postgres;

create index view_data_original_index
    on view_data_original ("refStructureName", "companyName", "fieldName", sectorName, plantRow, "detectedValueTypeId");

create table data_interpolated
(
    xx                 double precision,
    yy                 double precision,
    value              double precision,
    "refStructureName" text,
    "companyName"      text,
    "fieldName"        text,
    sectorName         text,
    plantRow             text,
    timestamp          bigint,
    "dumpId"           text,
    zz                 double precision default 0,
    constraint "data-interpolated-unique"
        unique (xx, yy, "refStructureName", "companyName", "fieldName", sectorName, plantRow, timestamp, zz)
);

alter table data_interpolated
    owner to postgres;

create index data_interpolated_index
    on data_interpolated ("refStructureName", "companyName", "fieldName", sectorName, plantRow, timestamp);

create table humidity_bins
(
    timestamp          bigint           not null,
    humidity_bin        text             not null,
    count              bigint           not null,
    "refStructureName" text             not null,
    "companyName"      text             not null,
    "fieldName"        text             not null,
    sectorName         double precision not null,
    plantRow             text             not null,
    "dumpId"           text,
    constraint "humidity-bins-unique"
        primary key (timestamp, humidity_bin, count, "refStructureName", "companyName", "fieldName", sectorName, plantRow)
);

alter table humidity_bins
    owner to postgres;

create table matrix_profile
(
    "matrixId" bigint,
    xx         integer,
    yy         integer,
    zz         integer,
    "optValue" double precision,
    weight     double precision
);

alter table matrix_profile
    owner to postgres;

create table watering_advice
(
    "refStructureName"    text,
    "companyName"         text,
    "fieldName"           text,
    sectorName            text,
    plantRow                text,
    evapotrans            double precision,
    "wateringAdvice"      boolean,
    timestamp             double precision,
    pluv                  double precision,
    "evapotransTimestamp" double precision,
    advice                double precision,
    delta                 double precision,
    "wateringHour"        double precision,
    duration              double precision,
    r                     double precision
);

alter table watering_advice
    owner to postgres;

create table permit_fields
(
    permitid           integer default nextval('"user_permits_userPermitId_seq"'::regclass) not null
        constraint user_permits_pkey
            primary key,
    affiliation        varchar(255)                                                         not null,
    "refStructureName" varchar(255)                                                         not null,
    "companyName"      varchar(255)                                                         not null,
    "fieldName"        varchar(255)                                                         not null,
    sectorName         varchar(255)                                                         not null,
    plantRow             varchar(255)                                                         not null,
    userid             varchar(255),
    permit             varchar(20)
);

alter table permit_fields
    owner to postgres;

create table users
(
    userid      varchar(100) not null
        constraint users_pk
            primary key,
    auth_type   varchar(10),
    affiliation varchar(100),
    pwd         varchar(100),
    role        varchar(20),
    name        varchar(255)
);

alter table users
    owner to postgres;

create table field_matrix
(
    "matrixId"         serial
        primary key,
    "refStructureName" text,
    "companyName"      text,
    "fieldName"        text,
    sectorName         text,
    plantRow             text,
    timestamp_from     bigint,
    timestamp_to       bigint,
    current            boolean
);

alter table field_matrix
    owner to postgres;

create table transcoding_fields
(
    id                 serial
        primary key,
    source             text,
    "refStructureName" text,
    "companyName"      text,
    "fieldName"        text,
    "coltureType"      text,
    sectorName         text,
    wateringcapacity   double precision,
    initialwatering    double precision,
    maximumwatering    double precision,
    advicetime         double precision,
    wateringtype       text,
    adviceweight       double precision,
    plantRowname         text,
    "sensorNumber"     text,
    sensorid           text,
    sensorname         text,
    sensortype         text,
    x                  double precision,
    y                  double precision,
    z                  double precision
);

alter table transcoding_fields
    owner to postgres;

