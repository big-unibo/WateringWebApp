--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg110+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advices (
    thesis_id integer NOT NULL,
    watering_start double precision NOT NULL,
    image_timestamp double precision,
    advice double precision NOT NULL,
    duration double precision,
    r double precision,
    evapotranspiration double precision,
    pluv double precision,
    last_watering double precision
);


ALTER TABLE public.advices OWNER TO postgres;

--
-- Name: anomalies_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anomalies_logs (
    "table" text,
    id_key integer,
    "timestamp" double precision,
    agent text,
    type text,
    description text
);


ALTER TABLE public.anomalies_logs OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    company_name text NOT NULL,
    address text,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: companies_organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies_organizations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    organization_id integer NOT NULL
);


ALTER TABLE public.companies_organizations OWNER TO postgres;

--
-- Name: companies_organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_organizations_id_seq OWNER TO postgres;

--
-- Name: companies_organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_organizations_id_seq OWNED BY public.companies_organizations.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    type text,
    description text,
    location public.geometry,
    binning_id integer,
    company_id integer,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devices_id_seq OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: devices_signals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices_signals (
    id integer NOT NULL,
    device_id integer NOT NULL,
    signal_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision
);


ALTER TABLE public.devices_signals OWNER TO postgres;

--
-- Name: signal_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signal_types (
    id integer NOT NULL,
    type text NOT NULL,
    type_description text NOT NULL
);


ALTER TABLE public.signal_types OWNER TO postgres;

--
-- Name: signals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signals (
    id integer NOT NULL,
    type_id integer NOT NULL,
    description text,
    x double precision,
    y double precision,
    z double precision,
    virtual boolean DEFAULT false,
    unit text,
    id_on_provider text,
    sensor_technology text,
    provider_id integer,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.signals OWNER TO postgres;

--
-- Name: devices_signals_denormalized; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.devices_signals_denormalized AS
 SELECT sig.id AS signal_id,
    sig.description AS signal_description,
    d.id AS device_id,
    d.description AS device_description,
    d.type AS device_type,
    d.binning_id AS device_binning_id,
    d.company_id AS device_company_id,
    st.type AS signal_type,
    st.type_description AS signal_type_description,
    sig.x,
    sig.y,
    sig.z,
    sig.virtual,
    sig.unit,
    sig.id_on_provider AS signal_id_on_provider,
    sig.provider_id,
    sig.sensor_technology,
    ds.valid_from,
    ds.valid_to
   FROM (((public.devices d
     LEFT JOIN public.devices_signals ds ON ((ds.device_id = d.id)))
     LEFT JOIN public.signals sig ON ((ds.signal_id = sig.id)))
     LEFT JOIN public.signal_types st ON ((sig.type_id = st.id)));


ALTER VIEW public.devices_signals_denormalized OWNER TO postgres;

--
-- Name: devices_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devices_signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devices_signals_id_seq OWNER TO postgres;

--
-- Name: devices_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devices_signals_id_seq OWNED BY public.devices_signals.id;


--
-- Name: farms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farms (
    id integer NOT NULL,
    farm_name text NOT NULL,
    company_id integer NOT NULL,
    location public.geometry,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.farms OWNER TO postgres;

--
-- Name: farms_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farms_devices (
    farm_id integer NOT NULL,
    device_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision,
    id integer NOT NULL
);


ALTER TABLE public.farms_devices OWNER TO postgres;

--
-- Name: farms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.farms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.farms_id_seq OWNER TO postgres;

--
-- Name: farms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.farms_id_seq OWNED BY public.farms.id;


--
-- Name: farms_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.farms_signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.farms_signals_id_seq OWNER TO postgres;

--
-- Name: farms_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.farms_signals_id_seq OWNED BY public.farms_devices.id;


--
-- Name: grid_optimal_profile_assignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grid_optimal_profile_assignment (
    optimal_profile_id integer NOT NULL,
    grid_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision,
    id integer NOT NULL,
    stop_percentage double precision,
    optimal_wet_bound double precision,
    optimal_dry_bound double precision
);


ALTER TABLE public.grid_optimal_profile_assignment OWNER TO postgres;

--
-- Name: grid_optimal_profile_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grid_optimal_profile_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grid_optimal_profile_assignment_id_seq OWNER TO postgres;

--
-- Name: grid_optimal_profile_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grid_optimal_profile_assignment_id_seq OWNED BY public.grid_optimal_profile_assignment.id;


--
-- Name: interpolated_cells; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interpolated_cells (
    profile_id integer NOT NULL,
    x double precision NOT NULL,
    y double precision NOT NULL,
    z double precision DEFAULT 0 NOT NULL,
    value double precision NOT NULL,
    value_source text
);


ALTER TABLE public.interpolated_cells OWNER TO postgres;

--
-- Name: interpolated_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interpolated_profiles (
    id integer NOT NULL,
    grid_id integer NOT NULL,
    "timestamp" double precision NOT NULL,
    true_sensor_number integer
);


ALTER TABLE public.interpolated_profiles OWNER TO postgres;

--
-- Name: interpolated_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interpolated_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interpolated_profiles_id_seq OWNER TO postgres;

--
-- Name: interpolated_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interpolated_profiles_id_seq OWNED BY public.interpolated_profiles.id;


--
-- Name: permits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permits (
    id integer NOT NULL,
    "table" text,
    role text NOT NULL,
    id_key integer,
    user_id integer NOT NULL,
    extra_attributes jsonb
);


ALTER TABLE public.permits OWNER TO postgres;

--
-- Name: sectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sectors (
    id integer NOT NULL,
    sector_name text NOT NULL,
    farm_id integer NOT NULL,
    culture text NOT NULL,
    culture_type text,
    location public.geometry,
    dripper_capacity double precision,
    sprinkler_capacity double precision,
    double_wing boolean,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.sectors OWNER TO postgres;

--
-- Name: sectors_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sectors_devices (
    sector_id integer NOT NULL,
    device_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision,
    id integer NOT NULL
);


ALTER TABLE public.sectors_devices OWNER TO postgres;

--
-- Name: sectors_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sectors_services (
    id integer NOT NULL,
    sector_id integer NOT NULL,
    service_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision
);


ALTER TABLE public.sectors_services OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    service_name text NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: theses_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.theses_devices (
    thesis_id integer NOT NULL,
    device_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision,
    id integer NOT NULL
);


ALTER TABLE public.theses_devices OWNER TO postgres;

--
-- Name: theses_in_sectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.theses_in_sectors (
    id integer NOT NULL,
    thesis_id integer NOT NULL,
    sector_id integer NOT NULL,
    valid_from double precision NOT NULL,
    valid_to double precision,
    weight double precision
);


ALTER TABLE public.theses_in_sectors OWNER TO postgres;

--
-- Name: measurements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.measurements (
    signal_id integer NOT NULL,
    "timestamp" double precision NOT NULL,
    computed boolean DEFAULT false,
    date date,
    "time" time without time zone,
    value double precision,
    raw_value text
);


ALTER TABLE public.measurements OWNER TO postgres;

--
-- Name: optimal_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.optimal_profiles (
    profile_id integer NOT NULL,
    x double precision NOT NULL,
    y double precision NOT NULL,
    z double precision NOT NULL,
    value double precision NOT NULL,
    weight double precision
);


ALTER TABLE public.optimal_profiles OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    organization_name text NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: permits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permits_id_seq OWNER TO postgres;

--
-- Name: permits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permits_id_seq OWNED BY public.permits.id;


--
-- Name: profiles_bins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles_bins (
    id integer NOT NULL,
    bound_0 double precision,
    bound_1 double precision,
    bound_2 double precision,
    bound_3 double precision,
    bound_4 double precision,
    bound_5 double precision,
    bound_6 double precision,
    description text
);


ALTER TABLE public.profiles_bins OWNER TO postgres;

--
-- Name: profiles_bins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profiles_bins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profiles_bins_id_seq OWNER TO postgres;

--
-- Name: profiles_bins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profiles_bins_id_seq OWNED BY public.profiles_bins.id;


--
-- Name: providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.providers (
    id integer NOT NULL,
    provider_name text NOT NULL
);


ALTER TABLE public.providers OWNER TO postgres;

--
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.providers_id_seq OWNER TO postgres;

--
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


--
-- Name: sectors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_id_seq OWNER TO postgres;

--
-- Name: sectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sectors_id_seq OWNED BY public.sectors.id;


--
-- Name: sectors_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sectors_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_services_id_seq OWNER TO postgres;

--
-- Name: sectors_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sectors_services_id_seq OWNED BY public.sectors_services.id;


--
-- Name: sectors_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sectors_signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_signals_id_seq OWNER TO postgres;

--
-- Name: sectors_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sectors_signals_id_seq OWNED BY public.sectors_devices.id;


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: signal_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signal_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signal_types_id_seq OWNER TO postgres;

--
-- Name: signal_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signal_types_id_seq OWNED BY public.signal_types.id;


--
-- Name: signals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signals_id_seq OWNER TO postgres;

--
-- Name: signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signals_id_seq OWNED BY public.signals.id;


--
-- Name: theses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.theses (
    id integer NOT NULL,
    thesis_name text NOT NULL,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.theses OWNER TO postgres;

--
-- Name: theses_all_signals; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.theses_all_signals AS
 WITH thesis_denorm AS (
         SELECT c.id AS company_id,
            c.company_name,
            f.id AS farm_id,
            f.farm_name,
            sec.id AS sector_id,
            sec.sector_name,
            t.id AS thesis_id,
            t.thesis_name
           FROM ((((public.companies c
             JOIN public.farms f ON ((f.company_id = c.id)))
             LEFT JOIN public.sectors sec ON ((sec.farm_id = f.id)))
             LEFT JOIN ( SELECT DISTINCT theses_in_sectors.thesis_id,
                    theses_in_sectors.sector_id
                   FROM public.theses_in_sectors) tsec ON ((tsec.sector_id = sec.id)))
             LEFT JOIN public.theses t ON ((tsec.thesis_id = t.id)))
        )
 SELECT td.company_id,
    td.company_name,
    td.farm_id,
    td.farm_name,
    td.sector_id,
    td.sector_name,
    td.thesis_id,
    td.thesis_name,
    dd.signal_id,
    dd.signal_description,
    dd.device_id,
    dd.signal_type,
    dd.signal_type_description,
    dd.device_description,
    dd.device_type,
    dd.device_binning_id,
    dd.x,
    dd.y,
    dd.z,
    dd.virtual,
    dd.unit,
    dd.provider_id,
    dd.signal_id_on_provider,
    dd.sensor_technology,
    GREATEST(tdev.valid_from, dd.valid_from) AS valid_from,
    LEAST(COALESCE(tdev.valid_to, 'Infinity'::double precision), COALESCE(dd.valid_to, 'Infinity'::double precision)) AS valid_to,
    'thesis'::text AS association_type
   FROM ((thesis_denorm td
     JOIN public.theses_devices tdev ON ((td.thesis_id = tdev.thesis_id)))
     JOIN public.devices_signals_denormalized dd ON ((tdev.device_id = dd.device_id)))
  WHERE ((dd.valid_from < COALESCE(tdev.valid_to, 'Infinity'::double precision)) AND (COALESCE(dd.valid_to, 'Infinity'::double precision) > tdev.valid_from))
UNION ALL
 SELECT td.company_id,
    td.company_name,
    td.farm_id,
    td.farm_name,
    td.sector_id,
    td.sector_name,
    td.thesis_id,
    td.thesis_name,
    dd.signal_id,
    dd.signal_description,
    dd.device_id,
    dd.signal_type,
    dd.signal_type_description,
    dd.device_description,
    dd.device_type,
    dd.device_binning_id,
    dd.x,
    dd.y,
    dd.z,
    dd.virtual,
    dd.unit,
    dd.provider_id,
    dd.signal_id_on_provider,
    dd.sensor_technology,
    GREATEST(sdev.valid_from, dd.valid_from) AS valid_from,
    LEAST(COALESCE(sdev.valid_to, 'Infinity'::double precision), COALESCE(dd.valid_to, 'Infinity'::double precision)) AS valid_to,
    'sector'::text AS association_type
   FROM ((thesis_denorm td
     JOIN public.sectors_devices sdev ON ((td.sector_id = sdev.sector_id)))
     JOIN public.devices_signals_denormalized dd ON ((sdev.device_id = dd.device_id)))
  WHERE ((dd.valid_from < COALESCE(sdev.valid_to, 'Infinity'::double precision)) AND (COALESCE(dd.valid_to, 'Infinity'::double precision) > sdev.valid_from))
UNION ALL
 SELECT td.company_id,
    td.company_name,
    td.farm_id,
    td.farm_name,
    td.sector_id,
    td.sector_name,
    td.thesis_id,
    td.thesis_name,
    dd.signal_id,
    dd.signal_description,
    dd.device_id,
    dd.signal_type,
    dd.signal_type_description,
    dd.device_description,
    dd.device_type,
    dd.device_binning_id,
    dd.x,
    dd.y,
    dd.z,
    dd.virtual,
    dd.unit,
    dd.provider_id,
    dd.signal_id_on_provider,
    dd.sensor_technology,
    GREATEST(fdev.valid_from, dd.valid_from) AS valid_from,
    LEAST(COALESCE(fdev.valid_to, 'Infinity'::double precision), COALESCE(dd.valid_to, 'Infinity'::double precision)) AS valid_to,
    'farm'::text AS association_type
   FROM ((thesis_denorm td
     JOIN public.farms_devices fdev ON ((td.farm_id = fdev.farm_id)))
     JOIN public.devices_signals_denormalized dd ON ((fdev.device_id = dd.device_id)))
  WHERE ((dd.valid_from < COALESCE(fdev.valid_to, 'Infinity'::double precision)) AND (COALESCE(dd.valid_to, 'Infinity'::double precision) > fdev.valid_from));


ALTER VIEW public.theses_all_signals OWNER TO postgres;

--
-- Name: master_data_permits; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.master_data_permits AS
  SELECT permits.user_id,
    permits.role,
    permits.extra_attributes,
    sectors.company_id,
    sectors.farm_id,
    sectors.sector_id,
    sectors.thesis_id,
    array_agg(DISTINCT sectors.service_name) AS services
   FROM public.permits
     JOIN ( SELECT c.id AS company_id,
            f.id AS farm_id,
            s.id AS sector_id,
            srv.service_name,
            ts.thesis_id
           FROM public.companies c
             LEFT JOIN public.farms f ON f.company_id = c.id
             LEFT JOIN public.sectors s ON s.farm_id = f.id
             LEFT JOIN public.sectors_services ss ON ss.sector_id = s.id
             LEFT JOIN public.services srv ON ss.service_id = srv.id
             LEFT JOIN ( SELECT DISTINCT theses_in_sectors.sector_id,
                    theses_in_sectors.thesis_id
                   FROM public.theses_in_sectors) ts ON ts.sector_id = s.id) sectors ON permits."table" = 'companies'::text AND permits.id_key = sectors.company_id OR permits."table" = 'sectors'::text AND permits.id_key = sectors.sector_id
  GROUP BY permits.user_id, permits.role, permits.extra_attributes, sectors.company_id, sectors.farm_id, sectors.sector_id, sectors.thesis_id;


ALTER VIEW public.master_data_permits OWNER TO postgres;

--
-- Name: theses_denormalized; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.theses_denormalized AS
 SELECT c.id AS company_id,
    c.company_name,
    f.id AS farm_id,
    f.farm_name,
    sec.id AS sector_id,
    sec.sector_name,
    t.id AS thesis_id,
    t.thesis_name,
    tsec.valid_from,
    tsec.valid_to
   FROM ((((public.companies c
     LEFT JOIN public.farms f ON ((f.company_id = c.id)))
     LEFT JOIN public.sectors sec ON ((sec.farm_id = f.id)))
     LEFT JOIN ( SELECT ts.thesis_id,
            ts.sector_id,
            min(ts.valid_from) AS valid_from,
                CASE
                    WHEN bool_or((ts.valid_to IS NULL)) THEN NULL::double precision
                    ELSE max(ts.valid_to)
                END AS valid_to
           FROM public.theses_in_sectors ts
          GROUP BY ts.thesis_id, ts.sector_id) tsec ON ((tsec.sector_id = sec.id)))
     LEFT JOIN public.theses t ON ((tsec.thesis_id = t.id)));


ALTER VIEW public.theses_denormalized OWNER TO postgres;


--
-- Name: devices_signals_permits; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.devices_signals_permits AS
 SELECT m.user_id,
    m.role,
    'companies'::text AS "table",
    m.company_id AS id,
    d.device_id,
    d.signal_id
   FROM ( SELECT DISTINCT master_data_permits.user_id,
            master_data_permits.role,
            master_data_permits.company_id
           FROM public.master_data_permits) m
     JOIN public.devices_signals_denormalized d ON m.company_id = d.device_company_id
  WHERE m.role = 'accounter'::text
UNION
 SELECT m.user_id,
    m.role,
    'farms'::text AS "table",
    m.farm_id AS id,
    ds.device_id,
    ds.signal_id
   FROM ( SELECT DISTINCT master_data_permits.user_id,
            master_data_permits.role,
            master_data_permits.farm_id
           FROM public.master_data_permits
          WHERE master_data_permits.role <> 'accounter'::text) m
     JOIN public.farms_devices fd ON m.farm_id = fd.farm_id
     JOIN public.devices_signals_denormalized ds ON fd.device_id = ds.device_id
UNION
 SELECT m.user_id,
    m.role,
    'sectors'::text AS "table",
    m.sector_id AS id,
    ds.device_id,
    ds.signal_id
   FROM ( SELECT DISTINCT master_data_permits.user_id,
            master_data_permits.role,
            master_data_permits.sector_id
           FROM public.master_data_permits
          WHERE master_data_permits.role <> 'accounter'::text) m
     JOIN public.sectors_devices sd ON m.sector_id = sd.sector_id
     JOIN public.devices_signals_denormalized ds ON sd.device_id = ds.device_id
UNION
 SELECT m.user_id,
    m.role,
    'theses'::text AS "table",
    m.thesis_id AS id,
    ds.device_id,
    ds.signal_id
   FROM ( SELECT DISTINCT master_data_permits.user_id,
            master_data_permits.role,
            master_data_permits.thesis_id
           FROM public.master_data_permits
          WHERE master_data_permits.role <> 'accounter'::text) m
     JOIN public.theses_devices td ON m.thesis_id = td.thesis_id
     JOIN public.devices_signals_denormalized ds ON td.device_id = ds.device_id;


ALTER VIEW public.devices_signals_permits OWNER TO postgres;

--
-- Name: theses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.theses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.theses_id_seq OWNER TO postgres;

--
-- Name: theses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.theses_id_seq OWNED BY public.theses.id;


--
-- Name: theses_in_sectors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.theses_in_sectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.theses_in_sectors_id_seq OWNER TO postgres;

--
-- Name: theses_in_sectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.theses_in_sectors_id_seq OWNED BY public.theses_in_sectors.id;


--
-- Name: theses_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.theses_signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.theses_signals_id_seq OWNER TO postgres;

--
-- Name: theses_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.theses_signals_id_seq OWNED BY public.theses_devices.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    phone text,
    disabled_at double precision,
    created_at double precision
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_actions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    "table" text NOT NULL,
    id_key integer NOT NULL,
    "timestamp" double precision NOT NULL,
    description text,
    payload jsonb
);


ALTER TABLE public.users_actions OWNER TO postgres;

--
-- Name: users_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_actions_id_seq OWNER TO postgres;

--
-- Name: users_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_actions_id_seq OWNED BY public.users_actions.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: watering_algorithm_params; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watering_algorithm_params (
    id integer NOT NULL,
    thesis_id integer NOT NULL,
    min_watering double precision,
    max_watering double precision,
    watering_baseline double precision,
    ki double precision,
    kp double precision,
    description text,
    valid_from double precision NOT NULL,
    valid_to double precision,
    error_function text,
    watering_frequency double precision
);


ALTER TABLE public.watering_algorithm_params OWNER TO postgres;

--
-- Name: watering_algorithm_params_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.watering_algorithm_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watering_algorithm_params_id_seq OWNER TO postgres;

--
-- Name: watering_algorithm_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.watering_algorithm_params_id_seq OWNED BY public.watering_algorithm_params.id;


--
-- Name: watering_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watering_events (
    id integer NOT NULL,
    sector_id integer NOT NULL,
    date date NOT NULL,
    watering_start double precision NOT NULL,
    watering_end double precision,
    advice double precision,
    duration double precision,
    expected_water double precision,
    note text,
    enabled boolean DEFAULT true NOT NULL,
    scheduled boolean
);


ALTER TABLE public.watering_events OWNER TO postgres;

--
-- Name: watering_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.watering_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watering_events_id_seq OWNER TO postgres;

--
-- Name: watering_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.watering_events_id_seq OWNED BY public.watering_events.id;


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: companies_organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies_organizations ALTER COLUMN id SET DEFAULT nextval('public.companies_organizations_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: devices_signals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices_signals ALTER COLUMN id SET DEFAULT nextval('public.devices_signals_id_seq'::regclass);


--
-- Name: farms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms ALTER COLUMN id SET DEFAULT nextval('public.farms_id_seq'::regclass);


--
-- Name: farms_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms_devices ALTER COLUMN id SET DEFAULT nextval('public.farms_signals_id_seq'::regclass);


--
-- Name: grid_optimal_profile_assignment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grid_optimal_profile_assignment ALTER COLUMN id SET DEFAULT nextval('public.grid_optimal_profile_assignment_id_seq'::regclass);


--
-- Name: interpolated_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interpolated_profiles ALTER COLUMN id SET DEFAULT nextval('public.interpolated_profiles_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: permits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permits ALTER COLUMN id SET DEFAULT nextval('public.permits_id_seq'::regclass);


--
-- Name: profiles_bins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles_bins ALTER COLUMN id SET DEFAULT nextval('public.profiles_bins_id_seq'::regclass);


--
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- Name: sectors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors ALTER COLUMN id SET DEFAULT nextval('public.sectors_id_seq'::regclass);


--
-- Name: sectors_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_devices ALTER COLUMN id SET DEFAULT nextval('public.sectors_signals_id_seq'::regclass);


--
-- Name: sectors_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_services ALTER COLUMN id SET DEFAULT nextval('public.sectors_services_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: signal_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signal_types ALTER COLUMN id SET DEFAULT nextval('public.signal_types_id_seq'::regclass);


--
-- Name: signals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signals ALTER COLUMN id SET DEFAULT nextval('public.signals_id_seq'::regclass);


--
-- Name: theses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses ALTER COLUMN id SET DEFAULT nextval('public.theses_id_seq'::regclass);


--
-- Name: theses_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_devices ALTER COLUMN id SET DEFAULT nextval('public.theses_signals_id_seq'::regclass);


--
-- Name: theses_in_sectors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_in_sectors ALTER COLUMN id SET DEFAULT nextval('public.theses_in_sectors_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users_actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_actions ALTER COLUMN id SET DEFAULT nextval('public.users_actions_id_seq'::regclass);


--
-- Name: watering_algorithm_params id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_algorithm_params ALTER COLUMN id SET DEFAULT nextval('public.watering_algorithm_params_id_seq'::regclass);


--
-- Name: watering_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_events ALTER COLUMN id SET DEFAULT nextval('public.watering_events_id_seq'::regclass);


INSERT INTO public.signal_types (id, type, type_description)
VALUES (1, 'SOIL_WATER_CONTENT', 'Soil water content'),
       (2, 'SOIL_WATER_POTENTIAL', 'Soil water potential'),
       (3, 'SOIL_TEMPERATURE', 'Soil temperature'),
       (4, 'AIR_TEMPERATURE', 'Air temperature'),
       (5, 'AIR_HUMIDITY', 'Air humidity'),
       (6, 'SOLAR_RADIATION', 'Solar radiation'),
       (7, 'RAIN_FALL', 'Rain fall'),
       (8, 'WIND_SPEED', 'Wind speed'),
       (9, 'WIND_DIRECTION', 'Wind direction'),
       (10, 'DRIPPER', 'Dripper');

INSERT INTO public.providers (id, provider_name)
VALUES (1, 'Provider A'), (2, 'Provider B');

INSERT INTO public.profiles_bins (id, bound_0, bound_1, bound_2, bound_3, bound_4, bound_5, bound_6, description)
VALUES (1, -10000, -1500, -300, -200, -100, -30, 0, 'Soil water potential'),
(2, 0, 12.5, 15.625, 18.75, 21.875, 25, 100, 'Soil water content - Loam soil'),
(3, 0, 10, 13.125, 16.25, 19.375, 22.5, 100, 'Soil water content - Sandy soil');

INSERT INTO public.organizations (id, organization_name) 
VALUES (1, 'Test Organization 1');

INSERT INTO public.companies (id, company_name, address, created_at) 
VALUES (1, 'Test Company 1', 'via XXV Aprile, 45 Faenza (Ra)', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(2, 'Test Company 2', 'via Roma, 33 Cesena (Fc)', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00'));

INSERT INTO public.farms (id, farm_name, company_id, location, created_at) 
VALUES (1, 'Test Farm 1', 1, public.ST_GeomFromText('POLYGON((10 45, 10.1 45, 10.1 45.1, 10 45.1, 10 45))', 4326), EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(2, 'Test Farm 2', 2, public.ST_GeomFromText('POLYGON((12 45, 12.1 45, 12.1 48.1, 12 45.1, 12 45))', 4326), EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(3, 'Test Farm 3', 2, public.ST_GeomFromText('POLYGON((12 45, 12.1 45, 12.1 48.1, 12 45.1, 12 45))', 4326), EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00'));

INSERT INTO public.sectors (id, sector_name, farm_id, culture, culture_type, location, dripper_capacity, sprinkler_capacity, double_wing, created_at) 
VALUES (1, 'Test Sector 1', 1, 'Kiwi', 'G3', public.ST_GeomFromText('POLYGON((10.01 45.01, 10.05 45.01, 10.05 45.05, 10.01 45.05, 10.01 45.01))', 4326), 4.0, NULL, false, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(2, 'Test Sector 2', 2, 'Kiwi', 'G3', NULL, 2.0, NULL, false, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(3, 'Test Sector 3', 2, 'Kiwi', 'G3', NULL, 3.0, NULL, false, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(4, 'Test Sector 4', 3, 'Kiwi', 'G3', NULL, 3.0, NULL, false, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00'));

INSERT INTO public.theses (id, thesis_name, created_at) 
VALUES (1, 'Thesis 1', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(2, 'Thesis 2', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(3, 'Thesis 3', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(4, 'Thesis 4', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(5, 'Thesis 5', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00'));

INSERT INTO public.theses_in_sectors (thesis_id, sector_id, valid_from) 
VALUES (1, 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(2, 2, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(3, 2, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(4, 3, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00')),
(5, 4, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 7:00:00'));

INSERT INTO public.devices (id, type, description, binning_id, location, company_id, created_at)
VALUES
(1, 'WEATHER_STATION', 'Farm 1 Station', NULL, public.ST_GeomFromText('POINT(10.05 45.05)', 4326), 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(2, 'FLOW_METER', 'Sector 1 Pressure Switch',  NULL, public.ST_GeomFromText('POINT(10.02 45.02)', 4326), 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(3, 'SOIL_MOISTURE_GRID', 'Thesis 1 Grid',   1, public.ST_GeomFromText('POINT(10.03 45.03)', 4326), 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(4, 'SOIL_MOISTURE_GRID', 'Thesis 2 Grid Test delete device',   1, public.ST_GeomFromText('POINT(13.03 43.03)', 4326), 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(5, 'SOIL_MOISTURE_GRID', 'Thesis 3 Grid Test delete thesis',   1, public.ST_GeomFromText('POINT(14.03 44.03)', 4326), 2, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00'));

INSERT INTO public.signals (id, type_id, provider_id, id_on_provider, unit, description, x, y, z, virtual, sensor_technology, created_at)
VALUES
(1, 4, 2, 'WS-TEMP-001', '°C', 'Station 1 Air Temp', 0, 200, 0, false, 'RTD', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(2, 5, 2, 'WS-HUM-001',  '%',  'Station 1 Humidity', NULL, NULL, NULL, false, 'Resistive', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(3, 1, 1, 'DRIP-SWC-01', 'L',  'Computed liter NPRESS01', 0, 0, 0, false, 'Pressure Sensor', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(4, 2, 1, 'GRID-GES-0-20', 'cbar', 'Grid 3 Ges 20>0', 0, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(5, 2, 1, 'GRID-GES-0-60', 'cbar', 'Grid 3 Ges 60>0', 0, 60, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(6, 2, 1, 'GRID-GES-40-20', 'cbar', 'Grid 3 Ges 20>40', 40, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(7, 2, 1, 'GRID-GES-40-60', 'cbar', 'Grid 3 Ges 60>40', 40, 60, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(8, 2, 1, 'GRID-2-GES-0-20', 'cbar', 'Grid 4 Ges 20>0', 0, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(9, 2, 1, 'GRID-2-GES-0-60', 'cbar', 'Grid 4 Ges 60>0', 0, 60, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(10, 2, 1, 'GRID-2-GES-40-20', 'cbar', 'Grid 4 Ges 20>40', 40, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(11, 2, 1, 'GRID-3-0-20', 'cbar', 'Grid 5 Ges 20>0', 0, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(12, 2, 1, 'GRID-3-0-60', 'cbar', 'Grid 5 Ges 60>0', 0, 60, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(13, 2, 1, 'GRID-3-40-20', 'cbar', 'Grid 5 Ges 20>40', 40, 20, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00')),
(14, 2, 1, 'GRID-3-40-60', 'cbar', 'Grid 5 Ges 60>40', 40, 60, 0, false, 'Gypsum Block', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-01 0:00:00'));

INSERT INTO public.devices_signals (device_id, signal_id, valid_from)
VALUES
(1, 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 10:00:00')),
(1, 2, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 10:00:00')),
(2, 3, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-20 10:00:00')),
(3, 4, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 10:00:00')),
(3, 5, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 10:00:00')),
(3, 6, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 10:00:00')),
(3, 7, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 10:00:00')),
(4, 8, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(4, 9, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(4, 10, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(4, 7, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(5, 11, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(5, 12, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(5, 13, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00')),
(5, 14, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00'));

INSERT INTO public.measurements(signal_id, timestamp, computed, date, time, value, raw_value)
VALUES 
(8, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:00:00'), false, '2025-01-22', '13:00:00', 22, '22'),
(7, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:00:00'), false, '2025-01-22', '13:00:00', 34.4, '34.4'),
(12, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:00:00'), false, '2025-01-22', '13:00:00', 44.76, '44.76');

INSERT INTO public.interpolated_profiles(id, grid_id, "timestamp", true_sensor_number)
VALUES (1, 4, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:30:00'), 2),
(2, 5, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:30:00'), 1);

INSERT INTO public.interpolated_cells(profile_id, x, y, z, value, value_source)
VALUES 
(1, 0, 20, 0, 22, 'Sensor Reading'),
(1, 40, 60, 0, 34.4, 'Sensor Reading'),
(2, 0, 20, 0, 44.76, 'Sensor Reading'),
(2, 40, 60, 0, 50.34, 'Interpolated');

INSERT INTO public.optimal_profiles(profile_id, x, y, z, value, weight)
	VALUES (1, 0, 20, 0, 28, 1);

INSERT INTO public.grid_optimal_profile_assignment(optimal_profile_id, grid_id, valid_from, valid_to, id, stop_percentage, optimal_wet_bound, optimal_dry_bound)
	VALUES (1, 4, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:30:00'), NULL, 1, NULL, -20, -300);

INSERT INTO public.theses_devices(thesis_id, device_id, valid_from, valid_to, id)
VALUES (2, 4, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00'), NULL, 1),
(3, 5, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00'), NULL, 2);

INSERT INTO public.users (id, email, password, name)
VALUES (
  1,
  'test-admin-user@example.com',
  'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86',
  'Test Admin'
);

INSERT INTO public.permits (id, "table", role, id_key, user_id)
VALUES (
  1,
  NULL,
  'administrator',
  NULL,
  1
);

INSERT INTO public.services (id, service_name)
VALUES
(1, 'Monitoring'),
(2, 'Watering Advice'),
(3, 'Prescriptive Watering Advice');

INSERT INTO public.advices(thesis_id, watering_start, image_timestamp, advice, duration, r, evapotranspiration, pluv, last_watering)
	VALUES (3, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 14:10:00'), EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 13:30:00'), 5, 100, 0.5, NULL, 0, 0);

INSERT INTO public.watering_events(id, sector_id, date, watering_start, watering_end, advice, duration, expected_water, note, enabled, scheduled)
	VALUES (1, 2, '2025-01-22', EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 14:10:00'), EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 15:50:00'), 5, 100, 0, NULL, true, true),
    (2, 2, '2199-12-31', EXTRACT(EPOCH FROM TIMESTAMP '2199-12-31 23:59:59'), NULL, NULL, NULL, NULL, NULL, true, false);

INSERT INTO public.watering_algorithm_params(id, thesis_id, min_watering, max_watering, watering_baseline, ki, kp, description, valid_from, valid_to, error_function, watering_frequency)
	VALUES (1, 3, 1, 10, 2, 3, 7, NULL, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00'), NULL, 'potential_error', 24);

INSERT INTO public.sectors_services(id, sector_id, service_id, valid_from, valid_to)
	VALUES (1, 2, 1, EXTRACT(EPOCH FROM TIMESTAMP '2025-01-22 12:00:00'), NULL);

--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 3, true);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.devices_id_seq', 6, true);


--
-- Name: devices_signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.devices_signals_id_seq', 16, false);


--
-- Name: farms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.farms_id_seq', 4, true);


--
-- Name: farms_signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.farms_signals_id_seq', 1, true);


--
-- Name: grid_optimal_profile_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grid_optimal_profile_assignment_id_seq', 2, false);


--
-- Name: interpolated_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interpolated_profiles_id_seq', 3, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 2, true);


--
-- Name: permits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permits_id_seq', 1, false);


--
-- Name: profiles_bins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profiles_bins_id_seq', 4, false);


--
-- Name: providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.providers_id_seq', 3, false);


--
-- Name: sectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sectors_id_seq', 5, true);


--
-- Name: sectors_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sectors_services_id_seq', 2, false);


--
-- Name: sectors_signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sectors_signals_id_seq', 1, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 3, true);


--
-- Name: signal_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signal_types_id_seq', 11, false);


--
-- Name: signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signals_id_seq', 15, true);


--
-- Name: theses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.theses_id_seq', 6, true);


--
-- Name: theses_in_sectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.theses_in_sectors_id_seq', 6, true);


--
-- Name: theses_signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.theses_signals_id_seq', 3, true);


--
-- Name: users_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_actions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, false);


--
-- Name: watering_algorithm_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.watering_algorithm_params_id_seq', 1, false);


--
-- Name: watering_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.watering_events_id_seq', 3, true);


--
-- Name: advices advices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advices
    ADD CONSTRAINT advices_pkey PRIMARY KEY (thesis_id, watering_start);


--
-- Name: companies_organizations companies_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies_organizations
    ADD CONSTRAINT companies_organizations_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: devices_signals devices_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices_signals
    ADD CONSTRAINT devices_signals_pkey PRIMARY KEY (id);


--
-- Name: devices_signals devices_signals_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices_signals
    ADD CONSTRAINT devices_signals_valid_from_key UNIQUE (device_id, signal_id, valid_from);


--
-- Name: farms_devices farms_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms_devices
    ADD CONSTRAINT farms_devices_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: farms_devices farms_signals_farm_id_signal_id_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms_devices
    ADD CONSTRAINT farms_signals_farm_id_signal_id_valid_from_key UNIQUE (farm_id, device_id, valid_from);


--
-- Name: grid_optimal_profile_assignment grid_optimal_profile_assignme_optimal_profile_id_grid_id_va_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grid_optimal_profile_assignment
    ADD CONSTRAINT grid_optimal_profile_assignme_optimal_profile_id_grid_id_va_key UNIQUE (optimal_profile_id, grid_id, valid_from);


--
-- Name: grid_optimal_profile_assignment grid_optimal_profile_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grid_optimal_profile_assignment
    ADD CONSTRAINT grid_optimal_profile_assignment_pkey PRIMARY KEY (id);


--
-- Name: interpolated_cells interpolated_cells_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interpolated_cells
    ADD CONSTRAINT interpolated_cells_pkey PRIMARY KEY (profile_id, x, y, z);


--
-- Name: interpolated_profiles interpolated_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interpolated_profiles
    ADD CONSTRAINT interpolated_profiles_pkey PRIMARY KEY (id);


--
-- Name: measurements measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT measurements_pkey PRIMARY KEY (signal_id, "timestamp");


--
-- Name: optimal_profiles optimal_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimal_profiles
    ADD CONSTRAINT optimal_profiles_pkey PRIMARY KEY (profile_id, x, y, z);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: permits permits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT permits_pkey PRIMARY KEY (id);


--
-- Name: profiles_bins profiles_bins_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check CHECK ((bound_0 < bound_1)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_check1; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check1 CHECK ((bound_1 < bound_2)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_check2; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check2 CHECK ((bound_2 < bound_3)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_check3; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check3 CHECK ((bound_3 < bound_4)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_check4; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check4 CHECK ((bound_4 < bound_5)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_check5; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles_bins
    ADD CONSTRAINT profiles_bins_check5 CHECK ((bound_5 < bound_6)) NOT VALID;


--
-- Name: profiles_bins profiles_bins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles_bins
    ADD CONSTRAINT profiles_bins_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: sectors_devices sectors_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_devices
    ADD CONSTRAINT sectors_devices_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: sectors_services sectors_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_services
    ADD CONSTRAINT sectors_services_pkey PRIMARY KEY (id);


--
-- Name: sectors_devices sectors_signals_sector_id_signal_id_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_devices
    ADD CONSTRAINT sectors_signals_sector_id_signal_id_valid_from_key UNIQUE (sector_id, device_id, valid_from);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: signal_types signal_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signal_types
    ADD CONSTRAINT signal_types_pkey PRIMARY KEY (id);


--
-- Name: signal_types signal_types_type_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signal_types
    ADD CONSTRAINT signal_types_type_id_key UNIQUE (type);


--
-- Name: signals signals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_pkey PRIMARY KEY (id);


--
-- Name: theses_devices theses_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_devices
    ADD CONSTRAINT theses_devices_pkey PRIMARY KEY (id);


--
-- Name: theses_in_sectors theses_in_sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_in_sectors
    ADD CONSTRAINT theses_in_sectors_pkey PRIMARY KEY (id);


--
-- Name: theses_in_sectors theses_in_sectors_thesis_sector_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_in_sectors
    ADD CONSTRAINT theses_in_sectors_thesis_sector_valid_from_key UNIQUE (thesis_id, sector_id, valid_from);


--
-- Name: theses theses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses
    ADD CONSTRAINT theses_pkey PRIMARY KEY (id);


--
-- Name: theses_devices theses_signals_thesis_id_signal_id_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_devices
    ADD CONSTRAINT theses_signals_thesis_id_signal_id_valid_from_key UNIQUE (thesis_id, device_id, valid_from);


--
-- Name: users_actions users_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_actions
    ADD CONSTRAINT users_actions_pkey PRIMARY KEY (id, id_key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: watering_algorithm_params watering_algorithm_params_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_algorithm_params
    ADD CONSTRAINT watering_algorithm_params_pkey PRIMARY KEY (id);


--
-- Name: watering_events watering_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_events
    ADD CONSTRAINT watering_events_pkey PRIMARY KEY (id);


--
-- Name: watering_events watering_events_sector_id_watering_start_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_events
    ADD CONSTRAINT watering_events_sector_id_watering_start_key UNIQUE (sector_id, watering_start);


--
-- Name: idx_cells_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cells_profile_id ON public.interpolated_cells USING btree (profile_id);


--
-- Name: idx_profiles_grid_id_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_grid_id_timestamp ON public.interpolated_profiles USING btree (grid_id, "timestamp");


--
-- Name: companies_organizations companies_organizations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies_organizations
    ADD CONSTRAINT companies_organizations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: companies_organizations companies_organizations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies_organizations
    ADD CONSTRAINT companies_organizations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: farms company_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms
    ADD CONSTRAINT company_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: devices_signals device_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices_signals
    ADD CONSTRAINT device_fk FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: devices devices_binning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_binning_id_fkey FOREIGN KEY (binning_id) REFERENCES public.profiles_bins(id) NOT VALID;


--
-- Name: devices devices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) NOT VALID;


--
-- Name: sectors farm_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT farm_fk FOREIGN KEY (farm_id) REFERENCES public.farms(id);


--
-- Name: farms_devices farms_devices_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms_devices
    ADD CONSTRAINT farms_devices_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) NOT VALID;


--
-- Name: farms_devices farms_devices_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farms_devices
    ADD CONSTRAINT farms_devices_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id);


--
-- Name: grid_optimal_profile_assignment grid_optimal_profile_assignment_grid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grid_optimal_profile_assignment
    ADD CONSTRAINT grid_optimal_profile_assignment_grid_id_fkey FOREIGN KEY (grid_id) REFERENCES public.devices(id);


--
-- Name: interpolated_cells interpolated_cells_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interpolated_cells
    ADD CONSTRAINT interpolated_cells_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.interpolated_profiles(id) NOT VALID;


--
-- Name: interpolated_profiles interpolated_profiles_grid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interpolated_profiles
    ADD CONSTRAINT interpolated_profiles_grid_id_fkey FOREIGN KEY (grid_id) REFERENCES public.devices(id);


--
-- Name: measurements measurements_signal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT measurements_signal_id_fkey FOREIGN KEY (signal_id) REFERENCES public.signals(id);


--
-- Name: watering_events sector_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_events
    ADD CONSTRAINT sector_fk FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: theses_in_sectors sector_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_in_sectors
    ADD CONSTRAINT sector_fk FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: sectors_devices sectors_devices_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_devices
    ADD CONSTRAINT sectors_devices_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) NOT VALID;


--
-- Name: sectors_devices sectors_devices_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_devices
    ADD CONSTRAINT sectors_devices_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: sectors_services sectors_services_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_services
    ADD CONSTRAINT sectors_services_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: sectors_services sectors_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors_services
    ADD CONSTRAINT sectors_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: devices_signals signal_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices_signals
    ADD CONSTRAINT signal_fk FOREIGN KEY (signal_id) REFERENCES public.signals(id);


--
-- Name: signals signals_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) NOT VALID;


--
-- Name: signals signals_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_type_fkey FOREIGN KEY (type_id) REFERENCES public.signal_types(id);


--
-- Name: theses_devices theses_devices_devices_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_devices
    ADD CONSTRAINT theses_devices_devices_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) NOT VALID;


--
-- Name: theses_devices theses_devices_thesis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_devices
    ADD CONSTRAINT theses_devices_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id);


--
-- Name: theses_in_sectors thesis_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.theses_in_sectors
    ADD CONSTRAINT thesis_fk FOREIGN KEY (thesis_id) REFERENCES public.theses(id);


--
-- Name: permits user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT user_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users_actions users_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_actions
    ADD CONSTRAINT users_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: watering_algorithm_params watering_algorithm_params_thesis_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_algorithm_params
    ADD CONSTRAINT watering_algorithm_params_thesis_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id);

--
-- PostgreSQL database dump complete
--