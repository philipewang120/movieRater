--
-- PostgreSQL database dump
--

\restrict KDPTvKBndJfsXv2QvB2wJJzQNkpevP8xDTEzMtaTy5CSIPHUey7PaygA0YKmLeS

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.3 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    title character varying(100) NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: movies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movies (
    id integer NOT NULL,
    movie_id integer NOT NULL,
    title character varying(50) NOT NULL,
    release_date date NOT NULL,
    watched_month integer NOT NULL,
    watched_year integer NOT NULL,
    poster_path text NOT NULL,
    remarks character varying(100) NOT NULL,
    tmdb_rating numeric(6,3) NOT NULL,
    my_rating integer NOT NULL,
    user_id integer,
    CONSTRAINT movies_my_rating_check CHECK (((my_rating >= 0) AND (my_rating <= 100))),
    CONSTRAINT movies_tmdb_rating_check CHECK (((tmdb_rating >= (0)::numeric) AND (tmdb_rating <= (100)::numeric))),
    CONSTRAINT movies_watched_month_check CHECK (((watched_month >= 1) AND (watched_month <= 12))),
    CONSTRAINT movies_watched_year_check CHECK ((watched_year >= 1800))
);


ALTER TABLE public.movies OWNER TO postgres;

--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movies_id_seq OWNER TO postgres;

--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    profile_pic text
);


ALTER TABLE public.users OWNER TO postgres;

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
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, title) FROM stdin;
1	study
2	make breakfast
3	buy online
5	sleep a little
6	clash of clans
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movies (id, movie_id, title, release_date, watched_month, watched_year, poster_path, remarks, tmdb_rating, my_rating, user_id) FROM stdin;
82	24	Kill Bill: Vol. 1	2003-10-10	11	2017	/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg	uma Thurman, the legend, absolute classic.	79.710	65	5
85	107	Snatch	2000-09-01	5	2019	/kJZoAHq1SLDdWjeNGtlHAnGpmFV.jpg	amazing watch, the movie that made me fall in love with guy ritchie	78.220	70	6
83	1292695	They Will Kill You	2026-03-25	5	2026	/6oI4oQKTWMVUlr8Ivqydp28Ruu6.jpg	one of the best female action movies I have watched since kill bill. loved it 	68.000	85	5
84	1318447	Apex	2026-04-24	5	2026	/eTp7gSPkSF3Aw79mNx1NkBP1PZT.jpg	slightly annoying movie	65.940	45	6
38	438631	Dune	2021-09-15	12	2022	/d5NXSklXo0qyIYkgV94XAgMIckC.jpg	sublime!!!!	77.760	90	5
55	44896	Rango	2011-03-02	5	2026	/A5MP1guV8pbruieG0tnpPIbaJtt.jpg	hilarious, rewatchable, not for kids	68.920	80	6
40	693134	Dune: Part Two	2024-02-27	12	2025	/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg	10/10 loved it	81.310	74	5
42	106	Predator	1987-06-12	12	2025	/k3mW4qfJo6SKqe6laRyNGnbB9n5.jpg	finally watched all of it	75.430	75	6
43	269149	Zootopia	2016-02-11	5	2018	/hlK0e0wAQ3VLuJcsfIYPvb4JVud.jpg	one of the movies, I have always rewatched, gives me a heartwarming feeling	77.580	80	5
44	646	Dr. No	1962-10-07	12	2025	/f9HsemSsBEHN5eoMble1bj6fDxs.jpg	the first James Bond, with the classic theme, money penny, for a young man its interesting to see 	69.920	65	6
45	1242898	Predator: Badlands	2025-11-05	1	2026	/pHpq9yNUIo6aDoCXEBzjSolywgz.jpg	slightly disappointed with the predator appearance, but action packed and ready for a sequel	77.510	75	6
46	120467	The Grand Budapest Hotel	2014-02-26	1	2020	/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg	proper Wes Anderson movie, great narration and cinematography, its nice seeing the familiar faces	80.330	65	5
48	1084242	Zootopia 2	2025-11-26	2	2026	/oJ7g2CifqpStmoYQyaLQgEU32qO.jpg	fun with subtle hints of contemporary humor which you will definitely notice	76.240	70	5
49	1306368	The Rip	2026-01-13	4	2026	/eZo31Dhl5BQ6GfbMNf3oU0tUvPZ.jpg	great action, and final twist, has great rewatch value	70.530	65	6
69	550	Fight Club	1999-10-15	5	2026	/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg	calssic	84.380	5	10
73	1327819	Hoppers	2026-03-04	5	2026	/xjtWQ2CL1mpmMNwuU5HeS4Iuwuu.jpg	die	79.000	3	10
59	350	The Devil Wears Prada	2006-06-29	5	2026	/8912AsVuS7Sj915apArUFbv6F9L.jpg	i loved the character development of the protagonist, meryll streep. Omg	73.910	70	5
78	668	On Her Majesty's Secret Service	1969-12-18	1	2026	/m3KfbxvqaiAvRJ6MpguA3GuLdDQ.jpg	the best 007 movie in my opinion	66.000	80	6
66	1327819	Hoppers	2026-03-04	5	2026	/xjtWQ2CL1mpmMNwuU5HeS4Iuwuu.jpg	found it slightly annoying	79.000	50	6
70	289	Casablanca	1943-01-15	1	2024	/lGCEKlJo2CnWydQj7aamY7s1S7Q.jpg	classic timeless romance movie. it has one of the most rewatchable values in cinema history	81.000	90	10
61	968	Dog Day Afternoon	1975-09-21	5	2026	/mavrhr0ig2aCRR8d48yaxtD5aMQ.jpg	hard one to rate	78.460	50	10
79	1297842	GOAT	2026-02-11	5	2026	/wfuqMlaExcoYiUEvKfVpUTt1v4u.jpg	fun movie to watch, highly recommended	79.900	75	6
80	639	When Harry Met Sally...	1989-07-12	5	2018	/rFOiFUhTMtDetqCGClC9PIgnC1P.jpg	timeless romance, which classic scenes that will always be remembered.	74.030	76	5
81	784607	The Fisherman's Diary	2020-09-01	5	2020	/qHFXpTGgI9EdD3cL0WQSHo7YD7v.jpg	masterpiece from big baba prox	75.000	60	6
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, profile_pic) FROM stdin;
5	philipewang120@gmail.com	google	https://lh3.googleusercontent.com/a/ACg8ocIS-xMkC9UNLRf408cIjCHaj9OcdJheI0knFqbRiMesgcgECKs=s96-c
6	diobebelle@gmail.com	google	https://lh3.googleusercontent.com/a/ACg8ocJEBvZhpbr19ERP4QYifBW5xQ9sEAuF6cpLdWRGeyDzmY8A_WY=s96-c
10	mpude@yahoo.com	$2b$10$3meS8p4t.S0MRj/p4LYShOLinFoc8zdbS7o0e/rcKb2wCzCibDmpW	\N
12	lombe@gmail.com	$2b$10$Md2unfDvFfXk4FR7mVedkeIvf6aFmuPrTbse8jkVUsZQLREZMv3oK	\N
\.


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 7, true);


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movies_id_seq', 85, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: movies movies_movie_user_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_movie_user_unique UNIQUE (movie_id, user_id);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: movies fk_movies_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT fk_movies_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KDPTvKBndJfsXv2QvB2wJJzQNkpevP8xDTEzMtaTy5CSIPHUey7PaygA0YKmLeS

