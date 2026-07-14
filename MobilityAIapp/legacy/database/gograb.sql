-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 17, 2022 at 02:42 PM
-- Server version: 5.7.40
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `qboxus_gograb`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `email`, `password`, `first_name`, `last_name`, `role`, `active`, `created`) VALUES
(1, 'admin@admin.com', '$2a$10$x1Xp8Q7xLLDE.cxcUHpF3uWpU2ZmW1MyDGlb7AU5KdWbMHv4oUtNO', 'System', 'Admin', 'admin', 1, '2022-04-22 16:13:03');

-- --------------------------------------------------------

--
-- Table structure for table `app_slider`
--

CREATE TABLE `app_slider` (
  `id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `app_slider`
--

INSERT INTO `app_slider` (`id`, `image`, `url`) VALUES
(7, 'app/webroot/uploads/6267dd7e67edb.jpeg', 'https://www.google.com/'),
(8, 'app/webroot/uploads/6267dd8cc62da.jpeg', 'https://www.google.com/'),
(9, 'app/webroot/uploads/6267dd9ebaf1d.jpeg', 'https://www.google.com/'),
(10, 'app/webroot/uploads/6267ddb1cc5f4.jpeg', 'https://www.google.com/');

-- --------------------------------------------------------

--
-- Table structure for table `coin_worth`
--

CREATE TABLE `coin_worth` (
  `id` int(11) NOT NULL,
  `price` float NOT NULL COMMENT 'value will be in dollars'
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `country`
--

CREATE TABLE `country` (
  `id` int(11) NOT NULL,
  `iso` char(2) NOT NULL,
  `name` varchar(80) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `numcode` smallint(6) DEFAULT NULL,
  `country_code` varchar(5) NOT NULL,
  `currency_code` varchar(255) NOT NULL,
  `currency_symbol` varchar(255) NOT NULL,
  `active` int(11) NOT NULL,
  `default` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `country`
--

INSERT INTO `country` (`id`, `iso`, `name`, `iso3`, `numcode`, `country_code`, `currency_code`, `currency_symbol`, `active`, `default`) VALUES
(1, 'AF', 'Afghanistan', '', 4, '+93', '', 'Afghan', 1, 0),
(2, 'AL', 'Albania', 'ALB', 8, '+355', ' ', ' ', 1, 0),
(3, 'DZ', 'ALGERIA', 'DZA', 12, '+213', ' ', ' ', 1, 0),
(4, 'AS', 'AMERICAN SAMOA', 'ASM', 16, '+1684', '23456', '3234567', 1, 0),
(5, 'AD', 'ANDORRA', 'AND', 20, '+376', '', '', 1, 0),
(6, 'AO', 'ANGOLA', 'AGO', 24, '+244', '', '', 1, 0),
(7, 'AI', 'ANGUILLA', 'AIA', 660, '+1264', '', '', 1, 0),
(8, 'AQ', 'ANTARCTICA', NULL, NULL, '0', '', '', 1, 0),
(9, 'AG', 'ANTIGUA AND BARBUDA', 'ATG', 28, '+1268', '', '', 1, 0),
(10, 'AR', 'ARGENTINA', 'ARG', 32, '+54', '', '', 1, 0),
(11, 'AM', 'ARMENIA', 'ARM', 51, '+374', '', '', 1, 0),
(12, 'AW', 'ARUBA', 'ABW', 533, '+297', '', '', 1, 0),
(13, 'AU', 'AUSTRALIA', 'AUS', 36, '+61', '', '', 1, 0),
(14, 'AT', 'AUSTRIA', 'AUT', 40, '+43', '', '', 1, 0),
(16, 'BS', 'BAHAMAS', 'BHS', 44, '+1242', '', '', 1, 0),
(17, 'BH', 'BAHRAIN', 'BHR', 48, '+973', '', '', 1, 0),
(18, 'BD', 'BANGLADESH', 'BGD', 50, '+880', '', '', 1, 0),
(19, 'BB', 'BARBADOS', 'BRB', 52, '+1246', '', '', 1, 0),
(20, 'BY', 'BELARUS', 'BLR', 112, '+375', '', '', 1, 0),
(21, 'BE', 'BELGIUM', 'BEL', 56, '+32', '', '', 1, 0),
(22, 'BZ', 'BELIZE', 'BLZ', 84, '+501', '', '', 1, 0),
(23, 'BJ', 'BENIN', 'BEN', 204, '+229', '', '', 1, 0),
(24, 'BM', 'BERMUDA', 'BMU', 60, '+1441', '', '', 1, 0),
(25, 'BT', 'BHUTAN', 'BTN', 64, '+975', '', '', 1, 0),
(26, 'BO', 'BOLIVIA', 'BOL', 68, '+591', '', '', 1, 0),
(27, 'BA', 'BOSNIA AND HERZEGOVINA', 'BIH', 70, '+387', '', '', 1, 0),
(28, 'BW', 'BOTSWANA', 'BWA', 72, '+267', '', '', 1, 0),
(29, 'BV', 'BOUVET ISLAND', NULL, NULL, '0', '', '', 1, 0),
(30, 'BR', 'BRAZIL', 'BRA', 76, '+55', '', '', 1, 0),
(31, 'IO', 'BRITISH INDIAN OCEAN TERRITORY', NULL, NULL, '+246', '', '', 1, 0),
(32, 'BN', 'BRUNEI DARUSSALAM', 'BRN', 96, '+673', '', '', 1, 0),
(33, 'BG', 'BULGARIA', 'BGR', 100, '+359', '', '', 1, 0),
(34, 'BF', 'BURKINA FASO', 'BFA', 854, '+226', '', '', 1, 0),
(35, 'BI', 'BURUNDI', 'BDI', 108, '+257', '', '', 1, 0),
(36, 'KH', 'CAMBODIA', 'KHM', 116, '+855', '', '', 1, 0),
(37, 'CM', 'CAMEROON', 'CMR', 120, '+237', '', '', 1, 0),
(38, 'CA', 'CANADA', 'CAN', 124, '+1', '', '', 1, 0),
(39, 'CV', 'CAPE VERDE', 'CPV', 132, '+238', '', '', 1, 0),
(40, 'KY', 'CAYMAN ISLANDS', 'CYM', 136, '+1345', '', '', 1, 0),
(41, 'CF', 'CENTRAL AFRICAN REPUBLIC', 'CAF', 140, '+236', '', '', 1, 0),
(42, 'TD', 'CHAD', 'TCD', 148, '+235', '', '', 1, 0),
(43, 'CL', 'CHILE', 'CHL', 152, '+56', '', '', 1, 0),
(44, 'CN', 'CHINA', 'CHN', 156, '+86', '', '', 1, 0),
(45, 'CX', 'CHRISTMAS ISLAND', NULL, NULL, '+61', '', '', 1, 0),
(46, 'CC', 'COCOS (KEELING) ISLANDS', NULL, NULL, '+672', '', '', 1, 0),
(47, 'CO', 'COLOMBIA', 'COL', 170, '+57', '', '', 1, 0),
(48, 'KM', 'COMOROS', 'COM', 174, '+269', '', '', 1, 0),
(49, 'CG', 'CONGO', 'COG', 178, '+242', '', '', 1, 0),
(50, 'CD', 'CONGO, THE DEMOCRATIC REPUBLIC OF THE', 'COD', 180, '+242', '', '', 1, 0),
(51, 'CK', 'COOK ISLANDS', 'COK', 184, '+682', '', '', 1, 0),
(52, 'CR', 'COSTA RICA', 'CRI', 188, '+506', '', '', 1, 0),
(53, 'CI', 'COTE D\'IVOIRE', '', 384, '+225', '', 'Franc CFA', 1, 0),
(54, 'HR', 'CROATIA', 'HRV', 191, '+385', '', '', 1, 0),
(55, 'CU', 'CUBA', 'CUB', 192, '+53', '', '', 1, 0),
(56, 'CY', 'CYPRUS', 'CYP', 196, '+357', '', '', 1, 0),
(57, 'CZ', 'CZECH REPUBLIC', 'CZE', 203, '+420', '', '', 1, 0),
(58, 'DK', 'DENMARK', 'DNK', 208, '+45', '', '', 1, 0),
(59, 'DJ', 'DJIBOUTI', 'DJI', 262, '+253', '', '', 1, 0),
(60, 'DM', 'DOMINICA', 'DMA', 212, '+1767', '', '', 1, 0),
(61, 'DO', 'DOMINICAN REPUBLIC', 'DOM', 214, '+1809', '', '', 1, 0),
(62, 'EC', 'ECUADOR', 'ECU', 218, '+593', '', '', 1, 0),
(63, 'EG', 'EGYPT', 'EGY', 818, '+20', '', '', 1, 0),
(64, 'SV', 'EL SALVADOR', 'SLV', 222, '+503', '', '', 1, 0),
(65, 'GQ', 'EQUATORIAL GUINEA', 'GNQ', 226, '+240', '', '', 1, 0),
(66, 'ER', 'ERITREA', 'ERI', 232, '+291', '', '', 1, 0),
(67, 'EE', 'ESTONIA', 'EST', 233, '+372', '', '', 1, 0),
(68, 'ET', 'ETHIOPIA', 'ETH', 231, '+251', '', '', 1, 0),
(69, 'FK', 'FALKLAND ISLANDS (MALVINAS)', 'FLK', 238, '+500', '', '', 1, 0),
(70, 'FO', 'FAROE ISLANDS', 'FRO', 234, '+298', '', '', 1, 0),
(71, 'FJ', 'FIJI', 'FJI', 242, '+679', '', '', 1, 0),
(72, 'FI', 'FINLAND', 'FIN', 246, '+358', '', '', 1, 0),
(73, 'FR', 'FRANCE', 'FRA', 250, '+33', '', '', 1, 0),
(74, 'GF', 'FRENCH GUIANA', 'GUF', 254, '+594', '', '', 1, 0),
(75, 'PF', 'FRENCH POLYNESIA', 'PYF', 258, '+689', '', '', 1, 0),
(76, 'TF', 'FRENCH SOUTHERN TERRITORIES', NULL, NULL, '0', '', '', 1, 0),
(77, 'GA', 'GABON', 'GAB', 266, '+241', '', '', 1, 0),
(78, 'GM', 'GAMBIA', 'GMB', 270, '+220', '', '', 1, 0),
(79, 'GE', 'GEORGIA', 'GEO', 268, '+995', '', '', 1, 0),
(80, 'DE', 'GERMANY', 'DEU', 276, '+49', '', '', 1, 0),
(81, 'GH', 'GHANA', 'GHA', 288, '+233', '', '', 1, 0),
(82, 'GI', 'GIBRALTAR', 'GIB', 292, '+350', '', '', 1, 0),
(83, 'GR', 'GREECE', 'GRC', 300, '+30', '', '', 1, 0),
(84, 'GL', 'GREENLAND', 'GRL', 304, '+299', '', '', 1, 0),
(85, 'GD', 'GRENADA', 'GRD', 308, '+1473', '', '', 1, 0),
(86, 'GP', 'GUADELOUPE', 'GLP', 312, '+590', '', '', 1, 0),
(87, 'GU', 'GUAM', 'GUM', 316, '+1671', '', '', 1, 0),
(88, 'GT', 'GUATEMALA', 'GTM', 320, '+502', '', '', 1, 0),
(89, 'GN', 'GUINEA', 'GIN', 324, '+224', '', '', 1, 0),
(90, 'GW', 'GUINEA-BISSAU', 'GNB', 624, '+245', '', '', 1, 0),
(91, 'GY', 'GUYANA', 'GUY', 328, '+592', '', '', 1, 0),
(92, 'HT', 'HAITI', 'HTI', 332, '+509', '', '', 1, 0),
(93, 'HM', 'HEARD ISLAND AND MCDONALD ISLANDS', NULL, NULL, '0', '', '', 1, 0),
(94, 'VA', 'HOLY SEE (VATICAN CITY STATE)', 'VAT', 336, '+39', '', '', 1, 0),
(95, 'HN', 'HONDURAS', 'HND', 340, '+504', '', '', 1, 0),
(96, 'HK', 'HONG KONG', 'HKG', 344, '+852', '', '', 1, 0),
(97, 'HU', 'HUNGARY', 'HUN', 348, '+36', '', '', 1, 0),
(98, 'IS', 'ICELAND', 'ISL', 352, '+354', '', '', 1, 0),
(99, 'IN', 'INDIA', 'IND', 356, '+91', 'INR', 'RS', 1, 0),
(100, 'ID', 'INDONESIA', 'IDN', 360, '+62', '', '', 1, 0),
(101, 'IR', 'IRAN, ISLAMIC REPUBLIC OF', 'IRN', 364, '+98', '', '', 1, 0),
(102, 'IQ', 'IRAQ', 'IRQ', 368, '+964', '', '', 1, 0),
(103, 'IE', 'IRELAND', 'IRL', 372, '+353', '', '', 1, 0),
(104, 'IL', 'ISRAEL', 'ISR', 376, '+972', '', '', 1, 0),
(105, 'IT', 'ITALY', 'ITA', 380, '+39', '', '', 1, 0),
(106, 'JM', 'JAMAICA', 'JAM', 388, '+1876', '', '', 1, 0),
(107, 'JP', 'JAPAN', 'JPN', 392, '+81', '', '', 1, 0),
(108, 'JO', 'JORDAN', 'JOR', 400, '+962', '', '', 1, 0),
(109, 'KZ', 'KAZAKHSTAN', 'KAZ', 398, '+7', '', '', 1, 0),
(110, 'KE', 'KENYA', 'KEN', 404, '+254', '', '', 1, 0),
(111, 'KI', 'KIRIBATI', 'KIR', 296, '+686', '', '', 1, 0),
(112, 'KP', 'KOREA, DEMOCRATIC PEOPLE\'S REPUBLIC OF', 'PRK', 408, '+850', '', '', 1, 0),
(113, 'KR', 'KOREA, REPUBLIC OF', 'KOR', 410, '+82', '', '', 1, 0),
(114, 'KW', 'KUWAIT', 'KWT', 414, '+965', '', '', 1, 0),
(115, 'KG', 'KYRGYZSTAN', 'KGZ', 417, '+996', '', '', 1, 0),
(116, 'LA', 'LAO PEOPLE\'S DEMOCRATIC REPUBLIC', 'LAO', 418, '+856', '', '', 1, 0),
(117, 'LV', 'LATVIA', 'LVA', 428, '+371', '', '', 1, 0),
(118, 'LB', 'LEBANON', 'LBN', 422, '+961', '', '', 1, 0),
(119, 'LS', 'LESOTHO', 'LSO', 426, '+266', '', '', 1, 0),
(120, 'LR', 'LIBERIA', 'LBR', 430, '+231', '', '', 1, 0),
(121, 'LY', 'LIBYAN ARAB JAMAHIRIYA', 'LBY', 434, '+218', '', '', 1, 0),
(122, 'LI', 'LIECHTENSTEIN', 'LIE', 438, '+423', '', '', 1, 0),
(123, 'LT', 'LITHUANIA', 'LTU', 440, '+370', '', '', 1, 0),
(124, 'LU', 'LUXEMBOURG', 'LUX', 442, '+352', '', '', 1, 0),
(125, 'MO', 'MACAO', 'MAC', 446, '+853', '', '', 1, 0),
(126, 'MK', 'MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF', 'MKD', 807, '+389', '', '', 1, 0),
(127, 'MG', 'MADAGASCAR', 'MDG', 450, '+261', '', '', 1, 0),
(128, 'MW', 'MALAWI', 'MWI', 454, '+265', '', '', 1, 0),
(129, 'MY', 'MALAYSIA', 'MYS', 458, '+60', '', '', 1, 0),
(130, 'MV', 'MALDIVES', 'MDV', 462, '+960', '', '', 1, 0),
(131, 'ML', 'MALI', 'MLI', 466, '+223', '', '', 1, 0),
(132, 'MT', 'MALTA', 'MLT', 470, '+356', '', '', 1, 0),
(133, 'MH', 'MARSHALL ISLANDS', 'MHL', 584, '+692', '', '', 1, 0),
(134, 'MQ', 'MARTINIQUE', 'MTQ', 474, '+596', '', '', 1, 0),
(135, 'MR', 'MAURITANIA', 'MRT', 478, '+222', '', '', 1, 0),
(136, 'MU', 'MAURITIUS', 'MUS', 480, '+230', '', '', 1, 0),
(137, 'YT', 'MAYOTTE', NULL, NULL, '+269', '', '', 1, 0),
(138, 'MX', 'MEXICO', 'MEX', 484, '+52', '', '', 1, 0),
(139, 'FM', 'MICRONESIA, FEDERATED STATES OF', 'FSM', 583, '+691', '', '', 1, 0),
(140, 'MD', 'MOLDOVA, REPUBLIC OF', 'MDA', 498, '+373', '', '', 1, 0),
(141, 'MC', 'MONACO', 'MCO', 492, '+377', '', '', 1, 0),
(142, 'MN', 'MONGOLIA', 'MNG', 496, '+976', '', '', 1, 0),
(143, 'MS', 'MONTSERRAT', 'MSR', 500, '+1664', '', '', 1, 0),
(144, 'MA', 'MOROCCO', 'MAR', 504, '+212', '', '', 1, 0),
(145, 'MZ', 'MOZAMBIQUE', 'MOZ', 508, '+258', '', '', 1, 0),
(146, 'MM', 'MYANMAR', 'MMR', 104, '+95', '', '', 1, 0),
(147, 'NA', 'NAMIBIA', 'NAM', 516, '+264', '', '', 1, 0),
(148, 'NR', 'NAURU', 'NRU', 520, '+674', '', '', 1, 0),
(149, 'NP', 'NEPAL', 'NPL', 524, '+977', '', '', 1, 0),
(150, 'NL', 'NETHERLANDS', 'NLD', 528, '+31', '', '', 1, 0),
(151, 'AN', 'NETHERLANDS ANTILLES', 'ANT', 530, '+599', '', '', 1, 0),
(152, 'NC', 'NEW CALEDONIA', 'NCL', 540, '+687', '', '', 1, 0),
(153, 'NZ', 'NEW ZEALAND', 'NZL', 554, '+64', '', '', 1, 0),
(154, 'NI', 'NICARAGUA', 'NIC', 558, '+505', '', '', 1, 0),
(155, 'NE', 'NIGER', '', 562, '+227', '', 'XOF', 1, 0),
(157, 'NU', 'NIUE', 'NIU', 570, '+683', '', '', 1, 0),
(158, 'NF', 'NORFOLK ISLAND', 'NFK', 574, '+672', '', '', 1, 0),
(159, 'MP', 'NORTHERN MARIANA ISLANDS', 'MNP', 580, '+1670', '', '', 1, 0),
(160, 'NO', 'NORWAY', 'NOR', 578, '+47', '', '', 1, 0),
(161, 'OM', 'OMAN', 'OMN', 512, '+968', '', '', 1, 0),
(162, 'PK', 'PAKISTAN', 'PAK', 586, '+92', 'PKR ', 'PKR ', 1, 0),
(163, 'PW', 'PALAU', 'PLW', 585, '+680', '', '', 1, 0),
(164, 'PS', 'PALESTINIAN TERRITORY, OCCUPIED', NULL, NULL, '+970', '', '', 1, 0),
(165, 'PA', 'PANAMA', 'PAN', 591, '+507', '', '', 1, 0),
(166, 'PG', 'PAPUA NEW GUINEA', 'PNG', 598, '+675', '', '', 1, 0),
(167, 'PY', 'PARAGUAY', 'PRY', 600, '+595', '', '', 1, 0),
(168, 'PE', 'PERU', 'PER', 604, '+51', '', '', 1, 0),
(169, 'PH', 'PHILIPPINES', 'PHL', 608, '+63', '', '', 1, 0),
(170, 'PN', 'PITCAIRN', 'PCN', 612, '0', '', '', 1, 0),
(171, 'PL', 'POLAND', 'POL', 616, '+48', '', '', 1, 0),
(172, 'PT', 'PORTUGAL', 'PRT', 620, '+351', '', '', 1, 0),
(173, 'PR', 'PUERTO RICO', 'PRI', 630, '+1787', '', '', 1, 0),
(174, 'QA', 'QATAR', 'QAT', 634, '+974', '', '', 1, 0),
(175, 'RE', 'REUNION', 'REU', 638, '+262', '', '', 1, 0),
(176, 'RO', 'ROMANIA', 'ROM', 642, '+40', '', '', 1, 0),
(177, 'RU', 'RUSSIAN FEDERATION', 'RUS', 643, '+70', '', '', 1, 0),
(178, 'RW', 'RWANDA', 'RWA', 646, '+250', '', '', 1, 0),
(179, 'SH', 'SAINT HELENA', 'SHN', 654, '+290', '', '', 1, 0),
(180, 'KN', 'SAINT KITTS AND NEVIS', 'KNA', 659, '+1869', '', '', 1, 0),
(181, 'LC', 'SAINT LUCIA', 'LCA', 662, '+1758', '', '', 1, 0),
(182, 'PM', 'SAINT PIERRE AND MIQUELON', 'SPM', 666, '+508', '', '', 1, 0),
(183, 'VC', 'SAINT VINCENT AND THE GRENADINES', 'VCT', 670, '+1784', '', '', 1, 0),
(184, 'WS', 'SAMOA', 'WSM', 882, '+684', '', '', 1, 0),
(185, 'SM', 'SAN MARINO', 'SMR', 674, '+378', '', '', 1, 0),
(186, 'ST', 'SAO TOME AND PRINCIPE', 'STP', 678, '+239', '', '', 1, 0),
(187, 'SA', 'SAUDI ARABIA', 'SAU', 682, '+966', '', '', 1, 0),
(188, 'SN', 'SENEGAL', 'SEN', 686, '+221', '', '', 1, 0),
(189, 'CS', 'SERBIA AND MONTENEGRO', NULL, NULL, '+381', '', '', 1, 0),
(190, 'SC', 'SEYCHELLES', 'SYC', 690, '+248', '', '', 1, 0),
(191, 'SL', 'SIERRA LEONE', 'SLE', 694, '+232', '', '', 1, 0),
(192, 'SG', 'SINGAPORE', 'SGP', 702, '+65', '', '', 1, 0),
(193, 'SK', 'SLOVAKIA', 'SVK', 703, '+421', '', '', 1, 0),
(194, 'SI', 'SLOVENIA', 'SVN', 705, '+386', '', '', 1, 0),
(195, 'SB', 'SOLOMON ISLANDS', 'SLB', 90, '+677', '', '', 1, 0),
(196, 'SO', 'SOMALIA', 'SOM', 706, '+252', '', '', 1, 0),
(197, 'ZA', 'SOUTH AFRICA', 'ZAF', 710, '+27', '', '', 1, 0),
(198, 'GS', 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', NULL, NULL, '0', '', '', 1, 0),
(199, 'ES', 'SPAIN', 'ESP', 724, '+34', '', '', 1, 0),
(200, 'LK', 'SRI LANKA', 'LKA', 144, '+94', '', '', 1, 0),
(201, 'SD', 'SUDAN', 'SDN', 736, '+249', '', '', 1, 0),
(202, 'SR', 'SURINAME', 'SUR', 740, '+597', '', '', 1, 0),
(203, 'SJ', 'SVALBARD AND JAN MAYEN', 'SJM', 744, '+47', '', '', 1, 0),
(204, 'SZ', 'SWAZILAND', 'SWZ', 748, '+268', '', '', 1, 0),
(205, 'SE', 'SWEDEN', 'SWE', 752, '+46', '', '', 1, 0),
(206, 'CH', 'SWITZERLAND', 'CHE', 756, '+41', '', '', 1, 0),
(207, 'SY', 'SYRIAN ARAB REPUBLIC', 'SYR', 760, '+963', '', '', 1, 0),
(208, 'TW', 'TAIWAN, PROVINCE OF CHINA', 'TWN', 158, '+886', '', '', 1, 0),
(209, 'TJ', 'TAJIKISTAN', 'TJK', 762, '+992', '', '', 1, 0),
(210, 'TZ', 'TANZANIA, UNITED REPUBLIC OF', 'TZA', 834, '+255', '', '', 1, 0),
(211, 'TH', 'THAILAND', 'THA', 764, '+66', '', '', 1, 0),
(212, 'TL', 'TIMOR-LESTE', NULL, NULL, '+670', '', '', 1, 0),
(213, 'TG', 'TOGO', 'TGO', 768, '+228', '', '', 1, 0),
(214, 'TK', 'TOKELAU', 'TKL', 772, '+690', '', '', 1, 0),
(215, 'TO', 'TONGA', 'TON', 776, '+676', '', '', 1, 0),
(216, 'TT', 'TRINIDAD AND TOBAGO', 'TTO', 780, '+1868', '', '', 1, 0),
(217, 'TN', 'TUNISIA', 'TUN', 788, '+216', '', '', 1, 0),
(218, 'TR', 'TURKEY', 'TUR', 792, '+90', '', '', 1, 0),
(219, 'TM', 'TURKMENISTAN', 'TKM', 795, '+7370', '', '', 1, 0),
(220, 'TC', 'TURKS AND CAICOS ISLANDS', 'TCA', 796, '+1649', '', '', 1, 0),
(221, 'TV', 'TUVALU', 'TUV', 798, '+688', '', '', 1, 0),
(222, 'UG', 'UGANDA', 'UGA', 800, '+256', '', '', 1, 0),
(223, 'UA', 'UKRAINE', 'UKR', 804, '+380', '', '', 1, 0),
(224, 'AE', 'UNITED ARAB EMIRATES', 'ARE', 784, '+971', '', '', 1, 0),
(225, 'GB', 'UNITED KINGDOM', 'GBR', 826, '+44', '', '', 1, 0),
(226, 'US', 'UNITED STATES', '', 840, '+1', '', '$', 1, 1),
(227, 'UM', 'UNITED STATES MINOR OUTLYING ISLANDS', NULL, NULL, '+1', '', '', 1, 0),
(228, 'UY', 'URUGUAY', 'URY', 858, '+598', '', '', 1, 0),
(229, 'UZ', 'UZBEKISTAN', 'UZB', 860, '+998', '', '', 1, 0),
(230, 'VU', 'VANUATU', 'VUT', 548, '+678', '', '', 1, 0),
(231, 'VE', 'VENEZUELA', 'VEN', 862, '+58', '', '', 1, 0),
(232, 'VN', 'VIET NAM', 'VNM', 704, '+84', '', '', 1, 0),
(233, 'VG', 'VIRGIN ISLANDS, BRITISH', 'VGB', 92, '+1284', '', '', 1, 0),
(234, 'VI', 'VIRGIN ISLANDS, U.S.', 'VIR', 850, '+1340', '', '', 1, 0),
(235, 'WF', 'WALLIS AND FUTUNA', 'WLF', 876, '+681', '', '', 1, 0),
(236, 'EH', 'WESTERN SAHARA', 'ESH', 732, '+212', '', '', 1, 0),
(237, 'YE', 'YEMEN', 'YEM', 887, '+967', '', '', 1, 0),
(238, 'ZM', 'ZAMBIA', 'ZMB', 894, '+260', '', '', 1, 0),
(239, 'ZW', 'ZIMBABWE', 'ZWE', 716, '+263', '', '', 1, 0),
(250, '', 'Josephine Porter', '', NULL, 'Nesci', '', 'Vitae quis totam vol', 1, 0),
(254, 'NG', 'Nigeria', '', 234, '+234', '', 'Naira', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `coupon`
--

CREATE TABLE `coupon` (
  `id` int(11) NOT NULL,
  `coupon_code` varchar(255) NOT NULL,
  `discount` int(11) NOT NULL COMMENT 'value would be in percentage',
  `expiry_date` date NOT NULL,
  `type` varchar(11) NOT NULL DEFAULT 'android',
  `limit_users` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `coupon_used`
--

CREATE TABLE `coupon_used` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_address`
--

CREATE TABLE `delivery_address` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `zip` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `apartment` varchar(255) NOT NULL,
  `instructions` text NOT NULL,
  `default` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_type`
--

CREATE TABLE `delivery_type` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `per_km_mile_charge` float NOT NULL,
  `image` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `driver_rating`
--

CREATE TABLE `driver_rating` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `star` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `food_category`
--

CREATE TABLE `food_category` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `food_category`
--

INSERT INTO `food_category` (`id`, `title`, `image`, `icon`, `created`) VALUES
(1, 'Home Style', 'app/webroot/uploads/62629d753361b.jpeg', 'app/webroot/uploads/62629d7533dbf.jpeg', '2022-04-22 17:03:28'),
(2, 'Pizza', 'app/webroot/uploads/62629d84e0473.jpeg', 'app/webroot/uploads/62629d84e0c90.jpeg', '2022-04-22 17:20:20'),
(3, 'Burger', 'app/webroot/uploads/62629d90d90a8.jpeg', 'app/webroot/uploads/62629d90d965f.jpeg', '2022-04-22 17:20:32'),
(4, 'Dasi Thal', 'app/webroot/uploads/62629ddde6622.jpeg', 'app/webroot/uploads/62629ddde6d7b.jpeg', '2022-04-22 17:21:49'),
(5, 'Chicken', 'app/webroot/uploads/62629dea9438f.jpeg', 'app/webroot/uploads/62629dea94a53.jpeg', '2022-04-22 17:22:02'),
(6, 'Biryani', 'app/webroot/uploads/62629dfe478da.jpeg', 'app/webroot/uploads/62629dfe4810b.jpeg', '2022-04-22 17:22:22'),
(7, 'Fries', 'app/webroot/uploads/62629e379606e.jpeg', 'app/webroot/uploads/62629e37967bc.jpeg', '2022-04-22 17:23:19'),
(8, 'Sandwich', 'app/webroot/uploads/6267136c530ed.jpeg', 'app/webroot/uploads/6267136c53f2f.jpeg', '2022-04-26 02:32:28');

-- --------------------------------------------------------

--
-- Table structure for table `food_order`
--

CREATE TABLE `food_order` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `hotel_accepted` int(2) NOT NULL,
  `accepted_reason` text NOT NULL,
  `user_place_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` float(10,2) NOT NULL,
  `status` int(11) NOT NULL COMMENT '0 processing 1 active  2completed  3 cancel ',
  `status_datetime` datetime NOT NULL,
  `delivery_fee` float(10,2) NOT NULL,
  `payment_card_id` int(11) NOT NULL,
  `delivery` int(11) NOT NULL COMMENT '0 - pickup, 1 - delivery',
  `rider_tip` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `tax` float(10,2) NOT NULL,
  `sub_total` float(10,2) NOT NULL,
  `instructions` text NOT NULL,
  `cod` int(2) NOT NULL,
  `notification` int(11) NOT NULL,
  `rejected_reason` text NOT NULL,
  `restaurant_delivery_fee` int(11) NOT NULL COMMENT 'restaurent will pay us this delivery fee',
  `total_distance_between_user_and_restaurant` int(11) NOT NULL COMMENT 'total distance between user address and hotel address',
  `delivery_fee_per_km` int(11) NOT NULL COMMENT 'resturent delivery fee per km',
  `delivery_free_range` int(11) NOT NULL COMMENT 'resturent free delivery range',
  `discount` float NOT NULL,
  `tracking` int(11) NOT NULL,
  `stripe_charge` varchar(200) NOT NULL,
  `device` varchar(10) NOT NULL,
  `version` varchar(25) NOT NULL,
  `restaurant_transaction_id` int(11) NOT NULL,
  `delivery_date_time` datetime NOT NULL,
  `rider_instruction` text NOT NULL,
  `signature` varchar(255) NOT NULL,
  `signature_person_name` varchar(255) NOT NULL,
  `restaurant_instruction` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_order_menu_extra_item`
--

CREATE TABLE `food_order_menu_extra_item` (
  `id` int(11) NOT NULL,
  `order_menu_item_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` float(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_order_menu_item`
--

CREATE TABLE `food_order_menu_item` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `instruction` text NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` float(10,2) NOT NULL,
  `image` varchar(255) NOT NULL,
  `deal_description` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `gift`
--

CREATE TABLE `gift` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `coin` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `gift_send`
--

CREATE TABLE `gift_send` (
  `id` int(11) NOT NULL,
  `gift_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `coin` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `good_type`
--

CREATE TABLE `good_type` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `good_type`
--

INSERT INTO `good_type` (`id`, `name`) VALUES
(1, 'Groceries'),
(2, 'bottled liquids'),
(3, 'Documents'),
(5, 'Clothing'),
(6, 'teryt'),
(7, 'Electronics'),
(8, 'Medicament');

-- --------------------------------------------------------

--
-- Table structure for table `html_page`
--

CREATE TABLE `html_page` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `html_page`
--

INSERT INTO `html_page` (`id`, `name`, `text`, `created`) VALUES
(1, 'privacyPolicy', '&lt;p&gt;We want you to understand the types of information we collect as you use our services&lt;/p&gt;\r\n\r\n&lt;p&gt;We collect information to provide better services to all our users &amp;mdash; from figuring out basic stuff like which language you speak, to more complex things like which &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-useful-ads&quot;&gt;ads you&amp;rsquo;ll find most useful&lt;/a&gt;, &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-people-online&quot;&gt;the people who matter most to you online&lt;/a&gt;, or which YouTube videos you might like. The information Google collects, and how that information is used, depends on how you use our services and how you manage your privacy controls.&lt;/p&gt;\r\n\r\n&lt;p&gt;When you&amp;rsquo;re not signed in to a Google Account, we store the information we collect with &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-unique-id&quot;&gt;unique identifiers&lt;/a&gt; tied to the browser, application, or &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-device&quot;&gt;device&lt;/a&gt; you&amp;rsquo;re using. This helps us do things like maintain your language preferences across browsing sessions.&lt;/p&gt;\r\n\r\n&lt;p&gt;When you&amp;rsquo;re signed in, we also collect information that we store with your Google Account, which we treat as &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-personal-info&quot;&gt;personal information&lt;/a&gt;.&lt;/p&gt;\r\n\r\n&lt;h2&gt;Things you create or provide to us&lt;/h2&gt;\r\n\r\n&lt;div class=&quot;pjyxF&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;zZLvvc&quot; src=&quot;https://www.gstatic.com/policies/privacy/d1b68e2cd423aba52d74f02573df2d2d.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;p&gt;When you create a Google Account, you provide us with &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-personal-info&quot;&gt;personal information&lt;/a&gt; that includes your name and a password. You can also choose to add a &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-phone-number&quot;&gt;phone number&lt;/a&gt; or &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-payment-info&quot;&gt;payment information&lt;/a&gt; to your account. Even if you aren&amp;rsquo;t signed in to a Google Account, you might choose to provide us with information &amp;mdash; like an email address to receive updates about our services.&lt;/p&gt;\r\n\r\n&lt;p&gt;We also collect the content you create, upload, or receive from others when using our services. This includes things like email you write and receive, photos and videos you save, docs and spreadsheets you create, and comments you make on YouTube videos.&lt;/p&gt;\r\n\r\n&lt;h2&gt;Information we collect as you use our services&lt;/h2&gt;\r\n\r\n&lt;h3&gt;Your apps, browsers &amp;amp; devices&lt;/h3&gt;\r\n\r\n&lt;div class=&quot;pjyxF&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;zZLvvc&quot; src=&quot;https://www.gstatic.com/policies/privacy/e79ea0ed464fc8952d5b5582f9f9ae53.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;p&gt;We collect information about the apps, browsers, and &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-devices&quot;&gt;devices&lt;/a&gt; you use to access Google services, which helps us provide features like automatic product updates and dimming your screen if your battery runs low.&lt;/p&gt;\r\n\r\n&lt;p&gt;The information we collect includes &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-unique-id&quot;&gt;unique identifiers&lt;/a&gt;, browser type and settings, device type and settings, operating system, mobile network information including carrier name and phone number, and application version number. We also collect information about the interaction of your apps, browsers, and devices with our services, including &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-ip&quot;&gt;IP address&lt;/a&gt;, crash reports, system activity, and the date, time, and &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-referrer-url&quot;&gt;referrer URL&lt;/a&gt; of your request.&lt;/p&gt;\r\n\r\n&lt;p&gt;We collect this information when a Google service on your device contacts our servers &amp;mdash; for example, when you install an app from the Play Store or when a service checks for automatic updates. If you&amp;rsquo;re using an &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-android-device&quot;&gt;Android device with Google apps&lt;/a&gt;, your device periodically contacts Google servers to provide information about your device and connection to our services. This information includes things like your device type, carrier name, crash reports, and which apps you&amp;#39;ve installed.&lt;/p&gt;\r\n\r\n&lt;h3&gt;Your activity&lt;/h3&gt;\r\n\r\n&lt;div class=&quot;pjyxF&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;zZLvvc&quot; src=&quot;https://www.gstatic.com/policies/privacy/39b031d352a2e1586cf50ac7f2bbc18b.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;p&gt;We collect information about your activity in our services, which we use to do things like recommend a YouTube video you might like. The activity information we collect may include:&lt;/p&gt;\r\n\r\n&lt;ul&gt;\r\n	&lt;li&gt;Terms you search for&lt;/li&gt;\r\n	&lt;li&gt;Videos you watch&lt;/li&gt;\r\n	&lt;li&gt;&lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-content-views&quot;&gt;Views and interactions with content and ads&lt;/a&gt;&lt;/li&gt;\r\n	&lt;li&gt;Voice and audio information when you use audio features&lt;/li&gt;\r\n	&lt;li&gt;Purchase activity&lt;/li&gt;\r\n	&lt;li&gt;People with whom you communicate or share content&lt;/li&gt;\r\n	&lt;li&gt;Activity on third-party sites and apps that use our services&lt;/li&gt;\r\n	&lt;li&gt;Chrome browsing history you&amp;rsquo;ve &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-chrome-sync&quot;&gt;synced with your Google Account&lt;/a&gt;&lt;/li&gt;\r\n&lt;/ul&gt;\r\n\r\n&lt;p&gt;If you use our &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-calls-messages&quot;&gt;services to make and receive calls or send and receive messages&lt;/a&gt;, we may collect telephony log information like your phone number, calling-party number, receiving-party number, forwarding numbers, time and date of calls and messages, duration of calls, routing information, and types of calls.&lt;/p&gt;\r\n\r\n&lt;p&gt;You can visit your Google Account to find and manage activity information that&amp;rsquo;s saved in your account.&lt;/p&gt;\r\n', '2020-11-25 23:47:05'),
(2, 'termsConditions', '&lt;p&gt;You have choices regarding the information we collect and how it&amp;#39;s used&lt;/p&gt;\r\n\r\n&lt;p&gt;This section describes key controls for managing your privacy across our services. You can also visit the &lt;a class=&quot;XddVQ&quot; href=&quot;https://myaccount.google.com/privacycheckup?utm_source=pp&amp;amp;utm_medium=Promo-in-product&amp;amp;utm_campaign=pp_body&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Privacy Checkup&lt;/a&gt;, which provides an opportunity to review and adjust important privacy settings. In addition to these tools, we also offer specific privacy settings in our products &amp;mdash; you can learn more in our &lt;a href=&quot;https://policies.google.com/technologies/product-privacy?hl=en-US&quot;&gt;Product Privacy Guide&lt;/a&gt;.&lt;/p&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM&quot; src=&quot;https://www.gstatic.com/policies/privacy/2951277d4c35389d7d304ed78d4fb6f6.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/privacycheckup?utm_source=pp&amp;amp;utm_medium=Promo-in-product&amp;amp;utm_campaign=pp_body&amp;amp;hl=en_US&quot;&gt;Go to Privacy Checkup&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;h2&gt;Managing, reviewing, and updating your information&lt;/h2&gt;\r\n\r\n&lt;p&gt;When you&amp;rsquo;re signed in, you can always review and update information by visiting the services you use. For example, Photos and Drive are both designed to help you manage specific types of content you&amp;rsquo;ve saved with Google.&lt;/p&gt;\r\n\r\n&lt;p&gt;We also built a place for you to review and control information saved in your Google Account. Your &lt;a class=&quot;XddVQ&quot; href=&quot;https://myaccount.google.com/?hl=en_US&quot; target=&quot;_blank&quot;&gt;Google Account&lt;/a&gt; includes:&lt;/p&gt;\r\n\r\n&lt;h3&gt;Privacy controls&lt;/h3&gt;\r\n\r\n&lt;div class=&quot;WTetv adRtod h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/3394102be0315326fd760e503b31c7b6.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;Activity Controls&lt;/h3&gt;\r\n\r\n&lt;p&gt;Decide what types of activity you&amp;rsquo;d like saved in your account. For example, you can turn on Location History if you want traffic predictions for your daily commute, or you can save your YouTube Watch History to get better video suggestions.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/activitycontrols?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to Activity Controls&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/900a793eae04f4bddd675f8d95c4a794.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;Ad settings&lt;/h3&gt;\r\n\r\n&lt;p&gt;Manage your preferences about the ads shown to you on Google and on sites and apps that &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-partner&quot;&gt;partner with Google&lt;/a&gt; to show ads. You can modify your interests, choose whether your personal information is used to make ads more relevant to you, and turn on or off certain advertising services.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://adssettings.google.com/?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to Ad Settings&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/c1b97d74dace7e43a9ccb26841a7cae4.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;About you&lt;/h3&gt;\r\n\r\n&lt;p&gt;Control what others see about you across Google services.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/profile?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to About You&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/e28714c71f217892f72b2698ea5cefef.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;Shared endorsements&lt;/h3&gt;\r\n\r\n&lt;p&gt;Choose whether your name and photo appear next to your activity, like reviews and recommendations, that appear in ads.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/shared-endorsements?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to Shared Endorsements&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;h3&gt;Ways to review &amp;amp; update your information&lt;/h3&gt;\r\n\r\n&lt;div class=&quot;WTetv adRtod h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/5e7cd445f8861a262a3da876f855a4cc.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;My Activity&lt;/h3&gt;\r\n\r\n&lt;p&gt;My Activity allows you to review and control data that&amp;rsquo;s created when you use Google services, like searches you&amp;rsquo;ve done or your visits to Google Play. You can browse by date and by topic, and delete part or all of your activity.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myactivity.google.com/myactivity?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to My Activity&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/02698a3383765bd3c250471c53a86c5a.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;Google Dashboard&lt;/h3&gt;\r\n\r\n&lt;p&gt;Google Dashboard allows you to manage information associated with specific products.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/dashboard?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to Dashboard&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM uTLSAb&quot; src=&quot;https://www.gstatic.com/policies/privacy/4f19891c43001db11efc8048f9bc7cdb.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;h3&gt;Your personal information&lt;/h3&gt;\r\n\r\n&lt;p&gt;Manage your contact information, such as your name, email, and phone number.&lt;/p&gt;\r\n\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/personal-info?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Go to Personal Info&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;p&gt;When you&amp;rsquo;re signed out, you can manage information associated with your browser or device, including:&lt;/p&gt;\r\n\r\n&lt;ul&gt;\r\n	&lt;li&gt;Signed-out search personalization: &lt;a class=&quot;XddVQ&quot; href=&quot;https://www.google.com/history/optout?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Choose&lt;/a&gt; whether your search activity is used to offer you more relevant results and recommendations.&lt;/li&gt;\r\n	&lt;li&gt;YouTube settings: Pause and delete your &lt;a class=&quot;XddVQ&quot; href=&quot;https://www.youtube.com/feed/history/search_history?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;YouTube Search History&lt;/a&gt; and your &lt;a class=&quot;XddVQ&quot; href=&quot;https://www.youtube.com/feed/history?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;YouTube Watch History&lt;/a&gt;.&lt;/li&gt;\r\n	&lt;li&gt;Ad Settings: &lt;a class=&quot;XddVQ&quot; href=&quot;https://adssettings.google.com/?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Manage&lt;/a&gt; your preferences about the ads shown to you on Google and on sites and apps that partner with Google to show ads.&lt;/li&gt;\r\n&lt;/ul&gt;\r\n\r\n&lt;h2&gt;Exporting, removing &amp;amp; deleting your information&lt;/h2&gt;\r\n\r\n&lt;p&gt;You can export a copy of content in your Google Account if you want to back it up or use it with a service outside of Google.&lt;/p&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM&quot; src=&quot;https://www.gstatic.com/policies/privacy/5959e84c2197c8a27da0a717f1cd47d5.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://takeout.google.com/?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Export your data&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;p&gt;You can also &lt;a class=&quot;XddVQ&quot; href=&quot;https://support.google.com/legal?p=privpol_remove&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;request to remove content&lt;/a&gt; from specific Google services based on applicable law.&lt;/p&gt;\r\n\r\n&lt;p&gt;To delete your information, you can:&lt;/p&gt;\r\n\r\n&lt;ul&gt;\r\n	&lt;li&gt;Delete your content from &lt;a class=&quot;g1mG8c&quot; href=&quot;https://policies.google.com/privacy?hl=en-US#footnote-delete-specific&quot;&gt;specific Google services&lt;/a&gt;&lt;/li&gt;\r\n	&lt;li&gt;Search for and then delete specific items from your account using &lt;a class=&quot;XddVQ&quot; href=&quot;https://myactivity.google.com/?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;My Activity&lt;/a&gt;&lt;/li&gt;\r\n	&lt;li&gt;&lt;a class=&quot;XddVQ&quot; href=&quot;https://myaccount.google.com/deleteservices?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Delete specific Google products&lt;/a&gt;, including your information associated with those products&lt;/li&gt;\r\n	&lt;li&gt;&lt;a class=&quot;XddVQ&quot; href=&quot;https://myaccount.google.com/deleteaccount?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Delete your entire Google Account&lt;/a&gt;&lt;/li&gt;\r\n&lt;/ul&gt;\r\n\r\n&lt;div class=&quot;h0yEnd&quot;&gt;\r\n&lt;div class=&quot;IN2z4b&quot;&gt;&lt;img alt=&quot;&quot; class=&quot;mZPFM&quot; src=&quot;https://www.gstatic.com/policies/privacy/1fa3e4ce8ac456f39ed02a6f9eb49b14.svg&quot; /&gt;&lt;/div&gt;\r\n\r\n&lt;div class=&quot;gwGFXb&quot;&gt;\r\n&lt;p&gt;&lt;a class=&quot;ky8S2&quot; href=&quot;https://myaccount.google.com/delete-services-or-account?utm_source=pp&amp;amp;hl=en_US&quot;&gt;Delete your information&lt;/a&gt;&lt;/p&gt;\r\n&lt;/div&gt;\r\n&lt;/div&gt;\r\n\r\n&lt;p&gt;And finally, &lt;a class=&quot;XddVQ&quot; href=&quot;https://myaccount.google.com/inactive?utm_source=pp&amp;amp;hl=en_US&quot; target=&quot;_blank&quot;&gt;Inactive Account Manager&lt;/a&gt; allows you to give someone else access to parts of your Google Account in case you&amp;rsquo;re unexpectedly unable to use your account.&lt;/p&gt;\r\n', '2020-11-25 23:47:33'),
(3, 'privacy_policy', 'sss', '2021-11-17 14:49:32');

-- --------------------------------------------------------

--
-- Table structure for table `language`
--

CREATE TABLE `language` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `language`
--

INSERT INTO `language` (`id`, `name`) VALUES
(1, 'english'),
(2, 'arabic');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `order_session`
--

CREATE TABLE `order_session` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `string` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `order_transaction`
--

CREATE TABLE `order_transaction` (
  `id` int(11) NOT NULL,
  `food_order_id` int(11) NOT NULL,
  `parcel_order_id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `package_size`
--

CREATE TABLE `package_size` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) NOT NULL,
  `price` float NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `package_size`
--

INSERT INTO `package_size` (`id`, `title`, `description`, `image`, `price`) VALUES
(1, 'Small', 'Small box', 'app/webroot/uploads/62ce9747eb851.jpeg', 10),
(2, 'Medium', 'Carry medium things', 'app/webroot/uploads/62ce9784c0041.jpeg', 20),
(3, 'Large', 'Carry large things', 'app/webroot/uploads/62ce978d00a6c.jpeg', 30),
(4, 'X Large', 'Carry extra large things', 'app/webroot/uploads/62ce97942011d.jpeg', 40);

-- --------------------------------------------------------

--
-- Table structure for table `parcel_order`
--

CREATE TABLE `parcel_order` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `package_size_id` int(11) NOT NULL,
  `good_type_id` int(11) NOT NULL,
  `schedule` int(11) NOT NULL,
  `ride_type_id` int(11) NOT NULL,
  `vehicle_type_id` int(11) NOT NULL,
  `price` float NOT NULL,
  `discount` float NOT NULL,
  `delivery_fee` float NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `cod` int(11) NOT NULL,
  `payment_card_id` int(11) NOT NULL,
  `total` float NOT NULL,
  `item_title` varchar(255) NOT NULL,
  `item_description` text NOT NULL,
  `pickup_datetime` datetime NOT NULL,
  `sender_name` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_phone` varchar(255) NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `receiver_email` varchar(255) NOT NULL,
  `receiver_phone` varchar(255) NOT NULL,
  `sender_location_lat` varchar(255) NOT NULL,
  `sender_location_long` varchar(255) NOT NULL,
  `sender_location_string` varchar(255) NOT NULL,
  `sender_address_detail` varchar(255) NOT NULL,
  `receiver_location_lat` varchar(255) NOT NULL,
  `receiver_location_long` varchar(255) NOT NULL,
  `receiver_location_string` varchar(255) NOT NULL,
  `receiver_address_detail` varchar(255) NOT NULL,
  `delivery_instruction` text NOT NULL,
  `sender_note_driver` text NOT NULL,
  `receiver_note_driver` text NOT NULL,
  `status` int(11) NOT NULL COMMENT '0 - pending,1- accepted , 2 - completed - 3 cancelled -4 assigned to rider',
  `signature` varchar(255) NOT NULL,
  `multi_stop` int(11) NOT NULL,
  `map` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `parcel_order_multi_stop`
--

CREATE TABLE `parcel_order_multi_stop` (
  `id` int(11) NOT NULL,
  `parcel_order_id` int(11) NOT NULL,
  `package_size_id` int(11) NOT NULL,
  `good_type_id` int(11) NOT NULL,
  `item_title` varchar(255) NOT NULL,
  `item_description` text NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `receiver_email` varchar(255) NOT NULL,
  `receiver_phone` varchar(255) NOT NULL,
  `receiver_location_lat` varchar(255) NOT NULL,
  `receiver_location_long` varchar(255) NOT NULL,
  `receiver_location_string` varchar(255) NOT NULL,
  `receiver_address_detail` varchar(255) NOT NULL,
  `receiver_note_driver` text NOT NULL,
  `delivery_instruction` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `payment_card`
--

CREATE TABLE `payment_card` (
  `id` int(11) NOT NULL,
  `stripe` varchar(255) NOT NULL,
  `last_4` int(11) NOT NULL,
  `brand` varchar(255) NOT NULL,
  `exp_month` int(11) NOT NULL,
  `exp_year` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `user_id` int(11) NOT NULL,
  `default` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `phone_no_verification`
--

CREATE TABLE `phone_no_verification` (
  `id` int(11) NOT NULL,
  `phone_no` varchar(20) NOT NULL,
  `code` int(4) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_coin`
--

CREATE TABLE `purchase_coin` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `coin` int(11) NOT NULL,
  `price` float NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `device` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `recent_location`
--

CREATE TABLE `recent_location` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `location_string` varchar(255) NOT NULL,
  `short_name` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `report_reason`
--

CREATE TABLE `report_reason` (
  `id` int(11) NOT NULL,
  `title` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `report_user`
--

CREATE TABLE `report_user` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `report_reason_title` varchar(255) NOT NULL,
  `report_user_id` int(11) NOT NULL,
  `report_reason_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `request`
--

CREATE TABLE `request` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `schedule` int(11) NOT NULL,
  `schedule_datetime` datetime DEFAULT NULL,
  `note` text NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `pickup_lat` varchar(255) NOT NULL,
  `pickup_long` varchar(255) NOT NULL,
  `dropoff_lat` varchar(255) NOT NULL,
  `dropoff_long` varchar(255) NOT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `dropoff_location` varchar(255) NOT NULL,
  `pickup_location_short_string` varchar(255) NOT NULL,
  `dropoff_location_short_string` varchar(255) NOT NULL,
  `request` int(11) NOT NULL COMMENT '0 - pending, 1 - accepted, 2 - rejected',
  `status` int(11) NOT NULL COMMENT '1- expired',
  `driver_response_datetime` datetime NOT NULL,
  `driver_ride_response` int(11) NOT NULL COMMENT '1- canceled ',
  `user_ride_response` int(11) NOT NULL COMMENT '1- cancelled',
  `reason` text NOT NULL,
  `on_the_way` int(11) NOT NULL,
  `arrive_on_location` int(11) NOT NULL,
  `arrive_on_location_datetime` datetime NOT NULL,
  `start_ride` int(11) NOT NULL,
  `end_ride` int(11) NOT NULL,
  `start_ride_datetime` datetime NOT NULL,
  `end_ride_datetime` datetime NOT NULL,
  `estimated_fare` float NOT NULL,
  `payment_type` varchar(255) NOT NULL COMMENT 'cash or card',
  `payment_method_id` int(11) NOT NULL,
  `collect_payment` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant`
--

CREATE TABLE `restaurant` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `lat` varchar(250) NOT NULL,
  `long` varchar(250) NOT NULL,
  `location_string` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `min_order_price` decimal(10,2) NOT NULL,
  `delivery_fee` float NOT NULL,
  `delivery_min_time` int(11) NOT NULL COMMENT 'min minutes',
  `delivery_max_time` int(11) NOT NULL COMMENT 'max minutes',
  `user_id` int(11) NOT NULL,
  `tax_free` float NOT NULL,
  `block` int(11) NOT NULL,
  `admin_commission` float NOT NULL COMMENT 'in percentage',
  `view` int(11) NOT NULL,
  `updated` datetime NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant`
--

INSERT INTO `restaurant` (`id`, `name`, `lat`, `long`, `location_string`, `image`, `min_order_price`, `delivery_fee`, `delivery_min_time`, `delivery_max_time`, `user_id`, `tax_free`, `block`, `admin_commission`, `view`, `updated`, `created`) VALUES
(1, 'Gril Hub', '31.438217', '73.131675', '', 'app/webroot/uploads/6267dfdd0fb1a.jpeg', '10.00', 20, 30, 40, 1, 1, 0, 5, 1, '2022-04-26 17:04:45', '2022-04-26 17:04:45'),
(2, 'Zook', '31.438217', '73.131675', '', 'app/webroot/uploads/6267e06e2cd3e.jpeg', '10.00', 20, 30, 40, 1, 1, 0, 0, 0, '2022-04-26 17:07:10', '2022-04-26 17:07:10'),
(3, 'Planet Pizza', '31.438217', '73.131675', '', 'app/webroot/uploads/6267e2b18309c.jpeg', '10.00', 20, 30, 40, 1, 1, 0, 0, 0, '2022-04-26 17:16:49', '2022-04-26 17:16:49'),
(4, 'Coffee Bar', '31.438217', '73.131675', '', 'app/webroot/uploads/6267e2ee9e6b6.jpeg', '10.00', 20, 30, 40, 1, 1, 0, 0, 0, '2022-04-26 17:17:50', '2022-04-26 17:17:50'),
(5, 'Buzuka', '31.438217', '73.131675', '', 'app/webroot/uploads/6267e34a9a3d1.jpeg', '10.00', 20, 30, 40, 1, 1, 0, 0, 0, '2022-04-26 17:19:22', '2022-04-26 17:19:22');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_category`
--

CREATE TABLE `restaurant_category` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `food_category_id` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `restaurant_category`
--

INSERT INTO `restaurant_category` (`id`, `restaurant_id`, `food_category_id`, `created`) VALUES
(26, 1, 3, '2022-04-28 00:05:42'),
(25, 1, 2, '2022-04-28 00:05:42'),
(24, 1, 1, '2022-04-28 00:05:42'),
(27, 1, 7, '2022-04-28 00:05:42'),
(28, 1, 8, '2022-04-28 00:05:42'),
(29, 4, 4, '2022-04-28 00:05:54'),
(30, 4, 6, '2022-04-28 00:05:54'),
(31, 5, 3, '2022-04-28 00:06:06'),
(32, 5, 5, '2022-04-28 00:06:06');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_favourite`
--

CREATE TABLE `restaurant_favourite` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `favourite` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_menu`
--

CREATE TABLE `restaurant_menu` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created` datetime NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  `has_menu_item` int(11) NOT NULL,
  `index` int(11) NOT NULL,
  `language_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant_menu`
--

INSERT INTO `restaurant_menu` (`id`, `name`, `description`, `created`, `restaurant_id`, `image`, `active`, `has_menu_item`, `index`, `language_id`) VALUES
(1, 'Kebab Platters', 'Classic Combo of Perfectly marinated and Grilled Prawns (6Pcs) &amp; Tandoori Fish Tikka (12 Pcs) served with Signature Barbeque Nation Crispy Corn &amp; Cajun Spiced Potato', '2022-04-26 17:33:05', 1, 'app/webroot/uploads/6267e6818a38b.jpeg', 1, 1, 0, 0),
(2, 'Biryani &amp; Rice', 'Boneless Chicken chunks marinated in authentic tikka masala and grilled on skewers', '2022-04-26 17:50:35', 1, 'app/webroot/uploads/6267ea9b70825.jpeg', 1, 1, 0, 0),
(3, 'Kebabs and Tikkas', ' ', '2022-04-28 12:21:49', 1, 'app/webroot/uploads/626a408dd8b26.jpeg', 1, 1, 0, 0),
(5, 'Barbeque in a Box', ' ', '2022-04-28 12:35:24', 1, 'app/webroot/uploads/626a43bc99f05.jpeg', 1, 1, 0, 0),
(6, 'Biryanis and Kebabs Box', ' ', '2022-04-28 12:40:00', 1, 'app/webroot/uploads/626a44d0268f7.jpeg', 1, 1, 0, 0),
(7, 'MilkShakes', ' ', '2022-04-28 12:45:48', 1, 'app/webroot/uploads/626a462ccd883.jpeg', 1, 1, 0, 0),
(8, 'Desserts', ' ', '2022-04-28 12:57:18', 1, 'app/webroot/uploads/626a48de46856.jpeg', 1, 1, 0, 0),
(9, 'Barbeque Nation', ' ', '2022-04-28 14:14:07', 2, 'app/webroot/uploads/626a5adfe6726.jpeg', 1, 1, 0, 0),
(10, 'Biryanis and Kebabs Box', ' ', '2022-04-28 14:23:24', 2, 'app/webroot/uploads/626a5d0c8d807.jpeg', 1, 1, 0, 0),
(11, 'Grills in a Box', ' ', '2022-04-28 14:30:55', 2, 'app/webroot/uploads/626a5ecf07239.jpeg', 1, 1, 0, 0),
(12, 'Kebab Platters', ' ', '2022-04-28 14:38:07', 2, 'app/webroot/uploads/626a607f341e6.jpeg', 1, 1, 0, 0),
(13, 'Meal Box and Thalis', ' ', '2022-04-28 14:44:45', 2, 'app/webroot/uploads/626a620d4b150.jpeg', 1, 1, 0, 0),
(14, 'Desserts', ' ', '2022-04-28 14:56:26', 2, 'app/webroot/uploads/626a64ca2a5db.jpeg', 1, 1, 0, 0),
(15, 'Domino&#039;s Pizza', '  ', '2022-04-28 15:01:38', 3, 'app/webroot/uploads/626a6602707a3.jpeg', 1, 1, 0, 0),
(16, 'Veg Pizza', ' ', '2022-04-28 15:13:10', 3, 'app/webroot/uploads/626a68b6e99ab.jpeg', 1, 1, 0, 0),
(17, 'Speciality Chicken', ' ', '2022-04-28 15:16:34', 3, 'app/webroot/uploads/626a6982045f9.jpeg', 1, 1, 0, 0),
(18, 'Meals &amp; Combos', ' ', '2022-04-28 15:18:48', 3, 'app/webroot/uploads/626a6a08c3720.jpeg', 1, 1, 0, 0),
(19, 'Sides ', ' ', '2022-04-28 15:22:25', 3, 'app/webroot/uploads/626a6ae17bdd3.jpeg', 1, 1, 0, 0),
(20, 'Drinks (Beverages)', ' ', '2022-04-28 15:25:45', 3, 'app/webroot/uploads/626a6ba94d91b.jpeg', 1, 1, 0, 0),
(21, 'Hot Coffee Selections', ' ', '2022-04-28 15:30:12', 4, 'app/webroot/uploads/626a6cb4d7304.jpeg', 1, 1, 0, 0),
(22, 'Yummy Snacks', ' ', '2022-04-28 15:37:32', 4, 'app/webroot/uploads/626a6e6ccd108.jpeg', 1, 1, 0, 0),
(23, 'Cookies N Chips', ' ', '2022-04-28 15:39:46', 4, 'app/webroot/uploads/626a6ef2e2104.jpeg', 1, 1, 0, 0),
(24, 'Celebration Cake', ' ', '2022-04-28 15:44:52', 4, 'app/webroot/uploads/626a70244557e.jpeg', 1, 1, 0, 0),
(25, 'Cold Coffee Delights', ' ', '2022-04-28 15:48:43', 4, 'app/webroot/uploads/626a710b9d1c3.jpeg', 1, 1, 0, 0),
(26, 'Beat The Heat With Iced Coffees', ' ', '2022-04-28 15:51:34', 4, 'app/webroot/uploads/626a71b6c9a67.jpeg', 1, 1, 0, 0),
(27, 'Hong&#039;s Kitchen', ' ', '2022-04-28 16:00:24', 5, 'app/webroot/uploads/626a73c8521e8.jpeg', 1, 1, 0, 0),
(28, 'Sides.', ' ', '2022-04-28 16:04:44', 5, 'app/webroot/uploads/626a74cc90cfe.jpeg', 1, 1, 0, 0),
(29, 'Noodles or Rice', ' ', '2022-04-28 16:10:00', 5, 'app/webroot/uploads/626a76082baae.jpeg', 1, 1, 0, 0),
(30, 'Gravies.', ' ', '2022-04-28 16:13:10', 5, 'app/webroot/uploads/626a76c6d1244.jpeg', 1, 1, 0, 0),
(31, 'Drinks (Beverages)', ' ', '2022-04-28 16:18:40', 5, 'app/webroot/uploads/626a7810179cf.jpeg', 1, 1, 0, 0),
(32, 'Desserts', ' ', '2022-04-28 16:22:57', 5, 'app/webroot/uploads/626a7911ecb0b.jpeg', 1, 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_menu_extra_item`
--

CREATE TABLE `restaurant_menu_extra_item` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` float NOT NULL,
  `created` datetime NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  `restaurant_menu_extra_section_id` int(11) NOT NULL,
  `language_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant_menu_extra_item`
--

INSERT INTO `restaurant_menu_extra_item` (`id`, `name`, `price`, `created`, `active`, `restaurant_menu_extra_section_id`, `language_id`) VALUES
(1, 'Coke 1.5', 100, '2022-07-06 15:22:16', 1, 1, 0),
(2, '7UP 1.5', 100, '2022-07-07 12:57:34', 1, 1, 0),
(3, 'Nesle 1.5', 40, '2022-07-07 12:58:07', 1, 2, 0),
(4, 'Mango Small', 20, '2022-07-07 12:58:57', 1, 3, 0),
(5, 'Chocolate Small', 20, '2022-07-07 13:00:03', 1, 3, 0);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_menu_extra_section`
--

CREATE TABLE `restaurant_menu_extra_section` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  `restaurant_menu_item_id` int(12) NOT NULL,
  `language_id` int(11) NOT NULL DEFAULT '1',
  `required` int(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant_menu_extra_section`
--

INSERT INTO `restaurant_menu_extra_section` (`id`, `name`, `restaurant_id`, `active`, `restaurant_menu_item_id`, `language_id`, `required`) VALUES
(1, 'Drinks', 1, 1, 4, 1, 0),
(2, 'Water', 1, 1, 4, 1, 0),
(3, 'Ice cream', 1, 1, 4, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_menu_item`
--

CREATE TABLE `restaurant_menu_item` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` float NOT NULL,
  `image` varchar(255) NOT NULL,
  `created` datetime NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  `restaurant_menu_id` int(11) NOT NULL,
  `out_of_order` int(11) NOT NULL,
  `language_id` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant_menu_item`
--

INSERT INTO `restaurant_menu_item` (`id`, `name`, `description`, `price`, `image`, `created`, `active`, `restaurant_menu_id`, `out_of_order`, `language_id`) VALUES
(1, 'Chicken Wings &amp; Tandoori Tangdi Platter', 'Combo of Tandoori Drumsticks (2Pcs) &amp; BBQ Chicken Wings (6Pcs) Served with our Signature duo , Cajun Spiced Potato &amp; Crispy Corn-Corn kernels dusted slightly in seasoned flour, deep fried and sprinkled with in-house masala, lip smacking in taste', 499, 'app/webroot/uploads/6267e625b21c0.jpeg', '2022-04-26 13:31:33', 1, 1, 0, 1),
(2, 'Fiery Chicken Wings', 'Nothing better than a spicy &amp; juicy chicken wing.These perennial party favorite spicy whole wings served with mint chutney &amp; onion rings will make you crave for more', 399, 'app/webroot/uploads/6267ea2db39e7.jpeg', '2022-04-26 13:48:45', 1, 1, 0, 1),
(3, 'Fiery Chicken Drumsticks', 'Spicy drumsticks marinated in Indian spices and hung curd cooked in clay oven -Tandoor and served with salad mix and mint chutney', 199, 'app/webroot/uploads/6267ea61bdd97.jpeg', '2022-04-26 13:49:37', 1, 1, 0, 1),
(4, 'Chicken Tikka Biryani', 'Boneless Chicken chunks marinated in authentic tikka masala and grilled on skewers and layered between aromatic rice. Served with Raita', 99, 'app/webroot/uploads/6267eada33191.jpeg', '2022-04-26 13:51:38', 1, 2, 0, 1),
(5, 'Chicken Biryani', 'Chicken marinated in in house blend of Indian spices and layered between aromatic rice. Served with Raita', 199, 'app/webroot/uploads/6267eb2e89b2b.jpeg', '2022-04-26 13:53:02', 1, 2, 0, 1),
(6, 'Veg Biryani', 'Garden fresh vegetables marinated in Chef&#039;s special blend of spices and layered with aromatic rice[ Served with Raita &amp; Salan ]', 155, 'app/webroot/uploads/6267ebbc916e9.jpeg', '2022-04-26 13:55:24', 1, 2, 0, 1),
(7, 'Cheesy Chicken Tikka', 'Soft, juicy kebabs that will just melt in your mouth. Tender pieces of boneless chicken -marinated in a unique blend of cream, cheese, and spices and cooked on grill . these kababs are mild and creamy with a rich taste that lingers on long after they have disappeared.', 339, 'app/webroot/uploads/626a410d221d5.jpeg', '2022-04-28 08:23:57', 1, 3, 0, 1),
(8, 'Chicken Tikka Boneless', 'Boneless Chicken chunks marinated in authentic tikka masala and grilled on skewers, one of India&#039;s most popular dishes.', 309, 'app/webroot/uploads/626a42524e24e.jpeg', '2022-04-28 08:29:22', 1, 3, 0, 1),
(9, 'Mutton Seekh Kebab', 'crumptious, full of juices &amp; flavors- These mutton mince kebabs (6Nos) cooked with Indian aromatic spices are perfect as a starter.', 279, 'app/webroot/uploads/626a42e6541dc.jpeg', '2022-04-28 08:31:50', 1, 3, 0, 1),
(10, 'Barbeque in a Box (Non Veg Overload)', 'Box of Barbeque Nation Signature delicacies: [Five Kebabs &amp; Tikkas] -Tandoori Tangdi (2Pcs) -Chicken Tikka (6Pcs) -Chili Garlic Prawns (6Pcs) -Kalmi Fish Tikka (6Pcs) -Reshmi Chicken Wings (6Pcs) [Three Curries &amp; Biriyani] -Dum Ka Murgh -Laal Mass -Egg Curry -Chicken Dum Biryani -Laccha Parantha (4Pcs) [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 1139, 'app/webroot/uploads/626a43f852f4c.jpeg', '2022-04-28 08:36:24', 1, 5, 0, 1),
(11, 'Barbeque in a Box (Veg)', 'Barbeque Nation Buffet served at Home: [ Six Starters] -Tandoori Paneer Tikka (6Pcs) -Honey Chilli Pineapple (6Pcs) -Veggie Fingers (4Pcs) -Cheese Triangles Jalapeno (4Pcs) -Veg Kabab (6Pcs) -Assorted Grilled Corn &amp; Veg. (2Pcs) [Main Course] -Paneer Makhanwala -Kadhai Veg -Dal Makhani -Veg Dum Biryani -Laccha Parantha (2Pcs) [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 899, 'app/webroot/uploads/626a4440cb22a.jpeg', '2022-04-28 08:37:36', 1, 5, 0, 1),
(12, 'Barbeque in a Box  Chicken Overload', 'Box of Barbeque Nation Signature delicacies: [Three Kebabs &amp; Tikkas] -Reshmi Chicken Wings (6 Pcs) -Chicken Tikka (6Pcs) -Tandoori Tangdi (2Pcs) [Three Curries &amp; Biriyani] -Dum Ka Murgh -Egg Curry -Dal Makhani -Chicken Dum Biryani -Laccha Parantha (2Pcs) [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 1099, 'app/webroot/uploads/626a44a799aaa.jpeg', '2022-04-28 08:39:19', 1, 5, 0, 1),
(13, 'Biryanis and Kebabs Box (Veg)', 'Kebabs &amp; Biryani Feast: [Three Starters] -Tandoori Paneer Tikka (9Pcs) -Veggie Fingers (6Pcs) -Cheese Triangles Jalapeno (7Pcs) [Veg Biryani - 3 Nos] [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 849, 'app/webroot/uploads/626a4529158e7.jpeg', '2022-04-28 08:41:29', 1, 6, 0, 1),
(14, 'Biryanis and Kebabs Box (Mutton)', 'Kebabs &amp; Biryani Feast: [Three Starters] -Tandoori Tangdi (2Pcs) -Chicken Tikka (9Pcs) -Kalmi Fish Tikka (10Pcs) [Mutton Dum Biryani - 3 Nos] [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 1149, 'app/webroot/uploads/626a457728602.jpeg', '2022-04-28 08:42:47', 1, 6, 0, 1),
(15, 'Biryanis and Kebabs Box (Chicken)', 'Kebabs &amp; Biryani Feast: [Three Starters] -Tandoori Tangdi (2Pcs) -Chicken Tikka (9Pcs) -Kalmi Fish Tikka (10Pcs) [Chicken Dum Biryani - 3 Nos] [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 999, 'app/webroot/uploads/626a45d206f4f.jpeg', '2022-04-28 08:44:18', 1, 6, 0, 1),
(16, 'Strawberry Shake', 'This shake is fantabulous! Cholcoate Kulfi &amp; chocolate syrup whirled together with Rabri.', 129, 'app/webroot/uploads/626a4677c51b5.jpeg', '2022-04-28 08:47:03', 1, 7, 0, 1),
(17, 'Chocolate Shake', 'This shake is fantabulous! Cholcoate Kulfi &amp; chocolate syrup whirled together with Rabri.', 129, 'app/webroot/uploads/626a46f17539d.jpeg', '2022-04-28 08:49:05', 1, 7, 0, 1),
(18, 'Kesar Pista Shake', 'Saffron Pista kulfi blened &amp; thickened with Rabri-a shake that can be had anytime of the year.', 129, 'app/webroot/uploads/626a472d2ecd0.jpeg', '2022-04-28 08:50:05', 1, 7, 0, 1),
(19, 'Chocolate Brownie', 'Perfect fudge square of chocolate topped with hot chocolate sauce.', 129, 'app/webroot/uploads/626a490fe1ade.jpeg', '2022-04-28 08:58:07', 1, 8, 0, 1),
(20, ' Angoori Jamun (12 Nos)', 'A bliss to gobble up these small spongy pearl shaped slightly warm gulab jamuns (12 Nos). A perfect mithai to conclude your meal', 119, 'app/webroot/uploads/626a493de1828.jpeg', '2022-04-28 08:58:53', 1, 8, 0, 1),
(21, 'BoxT20 Barbeque(Veg)', 'Barbeque Nation Buffet served at Home: [ Six Starters] -Tandoori Paneer Tikka (6Pcs) -Honey Chilli Pineapple (6Pcs) -Veggie Fingers (4Pcs) -Cheese Triangles Jalapeno (4Pcs) -Veg Kabab (6Pcs) -Assorted Grilled Corn &amp; Veg. (2Pcs) [Main Course] -Paneer Makhanwala -Kadhai Veg -Dal Makhani -Veg Dum Biryani -Laccha Parantha (2Pcs) [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 899, 'app/webroot/uploads/626a5c19673eb.jpeg', '2022-04-28 10:19:21', 1, 9, 0, 1),
(22, 'Ramadan Special Box', 'Welcome to the biggest flavour party at the Ramadan Feasting Fest Box! Enjoy a full-fledged 4 course meal with starters, main course and the choicest desserts. Appetizers: Tandoori Tangdi (2Pcs)+Chicken Tikka (6Pcs)+Chili Garlic Prawns (6Pcs)+Kalmi Fish Tikka (6Pcs)+Reshmi Chicken Wings (5Pcs), Curries -Mutton Khichda+Chicken Butter Masala+Egg Curry, Chicken Dum Biryani +Paratha (4Pcs) ,Desserts-Angoori Gulab Jamun (12Pcs)+Sheer Khurma+Moong Dal Halwa', 1199, 'app/webroot/uploads/626a5c7bc07c8.jpeg', '2022-04-28 10:20:59', 1, 9, 0, 1),
(23, 'Chicken Tikka Biryani', 'Boneless Chicken chunks marinated in authentic tikka masala and grilled on skewers and layered between aromatic rice. Served with Raita.', 349, 'app/webroot/uploads/626a5cafdbcca.jpeg', '2022-04-28 10:21:51', 1, 9, 0, 1),
(24, ' Biryanis And Kebabs Box Box (Veg)', 'Kebabs &amp; Biryani Feast: [Three Starters] -Tandoori Paneer Tikka (9Pcs) -Veggie Fingers (6Pcs) -Cheese Triangles Jalapeno (7Pcs) [Veg Biryani - 3 Nos] [Three Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 849, 'app/webroot/uploads/626a5d8e964e7.jpeg', '2022-04-28 10:25:34', 1, 10, 0, 1),
(25, 'My Biryanis and Kebabs Box - Regular', 'Kebabs &amp; Biryani Feast: [Two Starters] -Chicken Tikka (6Pcs) -Kalmi Fish Tikka (6Pcs) [Two Biryanis] -Chicken Dum Biryani -Mutton Dum Biryani [Two Desserts] -Angoori Gulab Jamun (8Pcs) -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad]', 729, 'app/webroot/uploads/626a5e4b384ac.jpeg', '2022-04-28 10:28:43', 1, 10, 0, 1),
(26, 'Biryanis and Kebabs Box (Veg) Regular', 'Kebabs &amp; Biryani Feast: [Two Starters] -Tandoori Paneer Tikka (6Pcs) -Veggie Fingers (4Pcs) [Veg Biryani - 2 Nos] [Two Desserts] -Angoori Gulab Jamun (8Pcs) -Moong Dal Halwa [Accompanied with Salan, Dips &amp; Salad] ]', 599, 'app/webroot/uploads/626a5ea7bb734.jpeg', '2022-04-28 10:30:15', 1, 10, 0, 1),
(27, 'Kebabs in a Box (Non Veg)', 'Barbeque Nation Buffet served at Home : [Four Starters] -Tandoori Tangdi (2Pcs) -Kalmi Fish Tikka (9Pcs) -Chili Garlic Prawns (9Pcs) -Veggie Fingers (6Pcs) [Dessert] -Angoori Gulab Jamun (8Pcs) [Accompanied with Dips &amp; Salad]', 749, 'app/webroot/uploads/626a5f3c971cb.jpeg', '2022-04-28 10:32:44', 1, 11, 0, 1),
(28, 'Kebab in a Box (Veg)', 'Box of succulent grilled Kebabs &amp; Dessert to satisfy your sweet craving: [Four Starters] -Tandoori Paneer Tikka (10Pcs) -Honey Chilli Pineapple (9Pcs) -Veggie Fingers (6Pcs) -Assorted Grilled Corn &amp; Veg. (4Pcs) [Dessert] -Angoori Gulab Jamun (8Pcs) [Accompanied with Dips &amp; Salad]', 549, 'app/webroot/uploads/626a5fde2f822.jpeg', '2022-04-28 10:35:26', 1, 11, 0, 1),
(29, 'Kebabs in a Box (Non Veg Overload)', 'Box of succulent grilled Kebabs: [Four Starters] -Tandoori Tangdi (2Pcs) -Kalmi Fish Tikka (9Pcs) -Chili Garlic Prawns (9Pcs) -Chicken Tikka (9Pcs) [Dessert] -Angoori Gulab Jamun (8Pcs) [Accompanied with Dips &amp; Salad]', 799, 'app/webroot/uploads/626a6058cb43a.jpeg', '2022-04-28 10:37:28', 1, 11, 0, 1),
(30, 'Chicken Wings andTandoori Tangdi Platter', 'Combo of Tandoori Drumsticks (2Pcs) &amp; BBQ Chicken Wings (6Pcs) Served with our Signature duo , Cajun Spiced Potato &amp; Crispy Corn-Corn kernels dusted slightly in seasoned flour, deep fried and sprinkled with in-house masala, lip smacking in taste.', 499, 'app/webroot/uploads/626a60f9462fa.jpeg', '2022-04-28 10:40:09', 1, 12, 0, 1),
(31, 'Fiery Chicken Wings (12 Nos)', 'Nothing better than a spicy &amp; juicy chicken wing.These perennial party favorite spicy whole wings served with mint chutney &amp; onion rings will make you crave for more', 569, 'app/webroot/uploads/626a616352e87.jpeg', '2022-04-28 10:41:55', 1, 12, 0, 1),
(32, 'Fiery Chicken Drumsticks (6 Nos)', 'Spicy drumsticks marinated in Indian spices and hung curd cooked in clay oven -Tandoor and served with salad mix and mint chutney', 569, 'app/webroot/uploads/626a61ae31736.jpeg', '2022-04-28 10:43:10', 1, 12, 0, 1),
(33, 'Meals in a Box (Veg)', 'Box of succulent grilled Kebabs &amp; Dessert to satisfy your sweet craving: [Two Starters] -Tandoori Paneer Tikka (6Pcs) -Veggie Fingers (4Pcs) [Main Course] -Paneer Makhanwala -Dal Makhani -Veg Dum Biryani -Laccha Parantha (2Pcs) [Desserts] -Angoori Gulab Jamun (8Pcs) -Brownie [Accompanied with Salan, Dips &amp; Salad]', 649, 'app/webroot/uploads/626a62aede0ce.jpeg', '2022-04-28 10:47:26', 1, 13, 0, 1),
(34, 'Butter Chicken &amp; Dal Makhani Meal', 'Wholesome meal of Butter Chicken [Boneless 4-5 Pcs], Dal Makhani [Served with Flavored Rice /Indian Bread ].', 289, 'app/webroot/uploads/626a636cc4b1b.jpeg', '2022-04-28 10:50:36', 1, 13, 0, 1),
(35, 'Paneer Butter Masala &amp; Dal Makhani Meal', 'Wholesome meal of Paneer Butter Masala ,Dal Makhani. Served with Flavored Rice /Indian Bread.', 269, 'app/webroot/uploads/626a642edf57a.jpeg', '2022-04-28 10:53:50', 1, 13, 0, 1),
(36, 'Chocolate Brownie', 'Perfect fudge square of chocolate topped with hot chocolate sauce.', 129, 'app/webroot/uploads/626a6516c0dbc.jpeg', '2022-04-28 10:57:42', 1, 14, 0, 1),
(37, 'Angoori Jamun (12 Nos)', 'A bliss to gobble up these small spongy pearl shaped slightly warm gulab jamuns (12 Nos). A perfect mithai to conclude your meal', 129, 'app/webroot/uploads/626a65984105d.jpeg', '2022-04-28 10:59:52', 1, 14, 0, 1),
(38, 'Spiced Double Chicken', 'Delightful combination of our spicy duo- Pepper Barbecue Chicken and Peri Peri Chicken for Chicken Lovers.', 309, 'app/webroot/uploads/626a66788bbab.jpeg', '2022-04-28 11:03:36', 1, 15, 0, 1),
(39, 'Burger Pizza - Classic Veg', 'Oven-baked buns with cheese, tomato &amp; capsicum in creamy mayo', 119, 'app/webroot/uploads/626a66a88b9f7.jpeg', '2022-04-28 11:04:24', 1, 15, 0, 1),
(40, 'Double Cheese Margherita', 'A classic delight loaded with extra 100% real mozzarella cheese', 209, 'app/webroot/uploads/626a671cbe4fc.jpeg', '2022-04-28 11:06:20', 1, 15, 0, 1),
(41, 'Farmhouse', 'Delightful combination of onion, capsicum, tomato &amp; grilled mushroom', 259, 'app/webroot/uploads/626a68fe3bb38.jpeg', '2022-04-28 11:14:22', 1, 16, 0, 1),
(42, 'Deluxe Veggie', 'Veg delight - onion, capsicum, grilled mushroom, corn &amp; paneer', 299, 'app/webroot/uploads/626a69439841e.jpeg', '2022-04-28 11:15:31', 1, 16, 0, 1),
(43, 'Paneer Makhani', 'Flavorful twist of spicy makhani sauce topped with paneer &amp; capsicum', 299, 'app/webroot/uploads/626a6977354da.jpeg', '2022-04-28 11:16:23', 1, 16, 0, 1),
(44, 'Roasted Chicken Wings Peri Peri', 'Crisp, roasted chicken wings in classic hot sauce and peri-peri flavour', 169, 'app/webroot/uploads/626a69b126a9f.jpeg', '2022-04-28 11:17:21', 1, 17, 0, 1),
(45, 'Roasted Chicken Wings Classic Hot Sauce', 'Crisp, Roasted Chicken Wings available in Classic Hot Sauce', 169, 'app/webroot/uploads/626a69d350fd5.jpeg', '2022-04-28 11:17:55', 1, 17, 0, 1),
(46, 'Chicken Meatballs Peri-Peri Seasoning', 'Tender, Juicy, Melt in Mouth Chicken Meatballs in Peri Peri seasoning', 149, 'app/webroot/uploads/626a69f9e12c6.jpeg', '2022-04-28 11:18:33', 1, 17, 0, 1),
(47, 'Meal for 2  Veg Extravaganza Combo', 'Med Veg Extravagnza + Garlic Bread + Pepsi + Choco Lava Cake', 724, 'app/webroot/uploads/626a6a480ad09.jpeg', '2022-04-28 11:19:52', 1, 18, 0, 1),
(48, 'Couples Combo - Veg', 'Med Farmhouse + Garlic Bread + Pepsi + Choco Lava Cake', 634, 'app/webroot/uploads/626a6a8bda62a.jpeg', '2022-04-28 11:20:59', 1, 18, 0, 1),
(49, 'Meal for 4 Chicken Dominator Combo', 'Large Chicken Dominator + 2 Garlic Bread + 2 Pepsi', 1051, 'app/webroot/uploads/626a6ad1797ac.jpeg', '2022-04-28 11:22:09', 1, 18, 0, 1),
(50, ' Paneer Tikka Stuffed Garlic Bread', 'Freshly Baked Stuffed Garlic Bread with Cheese, Onion and Paneer Tikka fillings. Comes with a dash of Basil Parsley Sprinkle on top', 169, 'app/webroot/uploads/626a6b1cca61c.jpeg', '2022-04-28 11:23:24', 1, 19, 0, 1),
(51, 'Red Velvet Lava Cake', 'A truly indulgent experience with sweet and rich red velvet cake on a ... read more', 139, 'app/webroot/uploads/626a6b548355d.jpeg', '2022-04-28 11:24:20', 1, 19, 0, 1),
(52, 'Choco Lava Cake', 'Chocolate lovers delight! Indulgent, gooey molten lava inside chocolate cake', 109, 'app/webroot/uploads/626a6b9767b43.jpeg', '2022-04-28 11:25:27', 1, 19, 0, 1),
(53, 'Pepsi (500ml)', 'Sparkling and Refreshing Beverage', 57.14, 'app/webroot/uploads/626a6bd6c9a6e.jpeg', '2022-04-28 11:26:30', 1, 20, 0, 1),
(54, '7Up (500ml)', 'Refreshing clear drink with a natural lemon flavor', 57.14, 'app/webroot/uploads/626a6c12daf33.jpeg', '2022-04-28 11:27:30', 1, 20, 0, 1),
(55, 'Mirinda (500ml)', 'Delicious Orange Flavoured beverage', 57.14, 'app/webroot/uploads/626a6c4309de3.jpeg', '2022-04-28 11:28:19', 1, 20, 0, 1),
(56, 'Cappuccino', 'A strong shot of Italian styled espresso, evened out with steamed and foamed milk., Serving Size(gm/ml) - 250, Energy (kcal) - 128.9 Contains Milk', 190, 'app/webroot/uploads/626a6d011deb4.jpeg', '2022-04-28 11:31:29', 1, 21, 0, 1),
(57, 'Cafe Latte', 'Light, hot coffee, with a shot of espresso in steamed milk., Serving Size(gm/ml) - 250, Energy (kcal) - 131.9 Contains Milk', 199, 'app/webroot/uploads/626a6d342a4cd.jpeg', '2022-04-28 11:32:20', 1, 21, 0, 1),
(58, 'Lemon Green Coffee', 'For the health conscious, loaded with the antioxidants of green coffee &amp; freshness of lemon, served cold., Serving Size(gm/ml) - 210, Energy (kcal) - 85.27', 189, 'app/webroot/uploads/626a6d960231c.jpeg', '2022-04-28 11:33:58', 1, 21, 0, 1),
(59, 'Toasty Paneer Garlic Bread', 'Garlic bread topped with spicy paneer tikka and cheese, Serving Size(gm/ml) - 100, Energy (kcal) - 338.7 , Contains Gluten, Contains Milk', 149, 'app/webroot/uploads/626a6e8d25492.jpeg', '2022-04-28 11:38:05', 1, 22, 0, 1),
(60, 'Smoked Chicken Garlic Bread', 'Wood fire smoked chicken, cheese and chili sauce on warm toasted bread, Serving Size(gm/ml) - 100, Energy (kcal) - 330.01 , Contains Gluten, Contains Milk, Contains Soy', 149, 'app/webroot/uploads/626a6eba11224.jpeg', '2022-04-28 11:38:50', 1, 22, 0, 1),
(61, 'Garlic Bread', 'Buttery rich, irresistible goodness of bread infused with healthy garlic bits, Serving Size(gm/ml) - 80, Energy (kcal) - 298.224 , Contains Gluten, Contains Milk, Contains Soy', 129, 'app/webroot/uploads/626a6ee056999.jpeg', '2022-04-28 11:39:28', 1, 22, 0, 1),
(62, ' Coffee Chocolate Biscotti Twin Pack (25gm each)', 'Coffee, choco chip and nut a perfect combination to give the best of all in one single biscotti. The light, crunchy and delicious snack will pair well with any of your favourite beverage', 47.62, 'app/webroot/uploads/626a6f31b17b0.jpeg', '2022-04-28 11:40:49', 1, 23, 0, 1),
(63, 'Funza Beetroot Nachos Twin Pack (40gm each)', 'Beetroot Nachos makes everyday snacking healthy and tasty, bringing the health benefits of beetroot with a Mexican twist in the Nacho form', 95.24, 'app/webroot/uploads/626a6fa5d296f.jpeg', '2022-04-28 11:42:45', 1, 23, 0, 1),
(64, 'Banana Bites', 'Fresh banana are used for making these great snacks, Crispy and flavorful snacks which could be consumed anytime and anywhere', 47.62, 'app/webroot/uploads/626a70123c5fe.jpeg', '2022-04-28 11:44:34', 1, 23, 0, 1),
(65, 'Dutch Truffle Cake (700 gm)', 'A sinful indulgence of a cake. Delightful cocoa cake laced with creamy truffle with an orange flavor, topped with a delicious ganache glaze, Serving Size(gm/ml) - 100, Energy (kcal) - 366.25 , Contains Gluten, Contains Milk, Contains Soy', 618, 'app/webroot/uploads/626a7063253cd.jpeg', '2022-04-28 11:45:55', 1, 24, 0, 1),
(66, 'Butterscotch Crunch Cake (690 gm)', 'Delightfully moist Butterscotch cake, layered with silky butterscotch mousse and topped with crunchy toffee crisps, Serving Size(gm/ml) - 100, Energy (kcal) - 258.77 , Contains Gluten, Contains Milk, Contains Nuts, Contains Soy', 618, 'app/webroot/uploads/626a70a9dd86d.jpeg', '2022-04-28 11:47:05', 1, 24, 0, 1),
(67, ' Red Velvet Cake', 'ndulge your taste buds with Red Velvet, the queen of all layered cakes with its soft red sponge and decadent cream cheese, Serving Size(gm/ml) - 100, Energy (kcal) - 274.22 , Contains Gluten, Contains Milk, Contains Soy', 571, 'app/webroot/uploads/626a70e1e7cd0.jpeg', '2022-04-28 11:48:01', 1, 24, 0, 1),
(68, 'Cafe Frappe', 'The rich, creamy and irresistible Cafe Frappe that is an all time favourite. Serving Size(gm/ml) - 350, Energy (kcal) - 335.48 Contains Milk, Contains Soy', 249, 'app/webroot/uploads/626a714857cac.jpeg', '2022-04-28 11:49:44', 1, 25, 0, 1),
(69, 'Cold Dark Frappe', 'Rich and creamy cold coffee with a scoop of ice cream, drenched with chocolate sauce, Serving Size(gm/ml) - 350, Energy (kcal) - 344.16 Contains Milk', 289, 'app/webroot/uploads/626a71943d053.jpeg', '2022-04-28 11:51:00', 1, 25, 0, 1),
(70, ' Iced Americano', 'Single shot of espresso and ice cold water make an addictive beverage to beat the heat, Serving Size(gm/ml) - 350, Energy (kcal) - 61.23', 199, 'app/webroot/uploads/626a722374af2.jpeg', '2022-04-28 11:53:23', 1, 26, 0, 1),
(71, ' Iced Americano No Sugar', 'Single shot of espresso without sugar and ice cold water make an addictive beverage to beat the heat, Serving Size(gm/ml) - 350, Energy (kcal) - 5.81', 199, 'app/webroot/uploads/626a725b30b7b.jpeg', '2022-04-28 11:54:19', 1, 26, 0, 1),
(72, 'Iced Americano Sugar Free', 'Single shot of espresso with sugarfree and ice cold water make an addictive beverage to beat the heat, Serving Size(gm/ml) - 350, Energy (kcal) - 5.80', 199, 'app/webroot/uploads/626a727e22697.jpeg', '2022-04-28 11:54:54', 1, 26, 0, 1),
(73, 'Veg Meal Bowl (Serve 1)', 'Veg Manchurian with a choice of Classic Hakka Noodles or Classic Fried Rice.', 129, 'app/webroot/uploads/626a74105858b.jpeg', '2022-04-28 12:01:36', 1, 27, 0, 1),
(74, 'Non Veg Meal Bowl (Serve 1)', 'Chicken in Manchurian Sauce with a choice of Classic Hakka Noodles or Classic Fried Rice.', 149, 'app/webroot/uploads/626a74622c7fa.jpeg', '2022-04-28 12:02:58', 1, 27, 0, 1),
(75, 'Honey Chilli Potato', 'Must-have Fried Potato strips tossed in a balanced honey &amp; Chilli sauce garnished with sesame seeds', 99, 'app/webroot/uploads/626a74b81cb53.jpeg', '2022-04-28 12:04:24', 1, 27, 0, 1),
(76, 'Molten Cheese Spring Roll', 'Must-have deep fried Spring rolls oozing with molten cheese', 129, 'app/webroot/uploads/626a75591075b.jpeg', '2022-04-28 12:07:05', 1, 28, 0, 1),
(77, 'Spicy Veg Spring Roll', 'Spring Roll with a Chilly Garlic filling of seasonal veggies', 99, 'app/webroot/uploads/626a757cb2b3e.jpeg', '2022-04-28 12:07:40', 1, 28, 0, 1),
(78, 'Classic Chicken Spring Roll', 'Spring Roll with a filling of ginger, garlic, spring onions and chicken mince', 129, 'app/webroot/uploads/626a75b40573c.jpeg', '2022-04-28 12:08:36', 1, 28, 0, 1),
(79, 'Chilli Garlic Noodles (Serves 2)', 'Noodles spiced up with Chilly &amp; Garlic, stir fried with seasonal veggies tossed in ginger garlic paste with seasoning of salt, pepper &amp; chinese spices', 199, 'app/webroot/uploads/626a7627ec906.jpeg', '2022-04-28 12:10:31', 1, 29, 0, 1),
(80, 'Classic Fried Rice', 'Rice stir fried with seasonal veggies tossed in ginger garlic paste with seasoning of salt, pepper &amp; chinese spices', 99, 'app/webroot/uploads/626a765faf126.jpeg', '2022-04-28 12:11:27', 1, 29, 0, 1),
(81, 'White Steamed Rice (Serves 2)', 'Classic White Rice steamed to perfection', 169, 'app/webroot/uploads/626a76b2aea62.jpeg', '2022-04-28 12:12:50', 1, 29, 0, 1),
(82, 'Schezwan Vegetable (Serves 2)', 'Spicy &amp; Tangy flavoured sauce with chilly, garlic, spices and seasonal veggies', 299, 'app/webroot/uploads/626a77041f0b2.jpeg', '2022-04-28 12:14:12', 1, 30, 0, 1),
(83, 'Kung Pao Paneer (Serves 2)', 'Sweet &amp; tangy brown soy based sauce with succulent paneer pieces topped with peanuts', 299, 'app/webroot/uploads/626a776845bff.jpeg', '2022-04-28 12:15:52', 1, 30, 0, 1),
(84, 'Sweet And Sour Vegetable (Serves 2)', 'Asian vegetables tossed in a sweet and tangy balanced sauce', 299, 'app/webroot/uploads/626a77e347a62.jpeg', '2022-04-28 12:17:55', 1, 30, 0, 1),
(85, 'Classic Lemonade', 'The absolute classic answer to summer blues!', 69, 'app/webroot/uploads/626a785cf3031.jpeg', '2022-04-28 12:19:56', 1, 31, 0, 1),
(86, 'PEPSI (500 ml)', 'The absolute classic answer to summer blues!', 57.14, 'app/webroot/uploads/626a789e53941.jpeg', '2022-04-28 12:21:02', 1, 31, 0, 1),
(87, 'Orange Mint Mojito', 'Mojito made with yummy touches of Orange &amp; Mint', 109, 'app/webroot/uploads/626a78d0618a5.jpeg', '2022-04-28 12:21:52', 1, 31, 0, 1),
(88, ' Choco Bao', 'Flavoured bao oozing with Rich chocolate richness', 99, 'app/webroot/uploads/626a7935ef4af.jpeg', '2022-04-28 12:23:33', 1, 32, 0, 1),
(89, 'Chocolate Brownie', 'The classic rich &amp; flavourful Chocolate Brownie', 99, 'app/webroot/uploads/626a795ec7e40.jpeg', '2022-04-28 12:24:14', 1, 32, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_rating`
--

CREATE TABLE `restaurant_rating` (
  `id` int(11) NOT NULL,
  `star` int(11) NOT NULL,
  `comment` varchar(255) NOT NULL,
  `created` datetime NOT NULL,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `language_id` int(11) NOT NULL DEFAULT '1',
  `food_order_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_request`
--

CREATE TABLE `restaurant_request` (
  `id` int(11) NOT NULL,
  `restaurant_name` varchar(255) NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_timing`
--

CREATE TABLE `restaurant_timing` (
  `id` int(11) NOT NULL,
  `day` varchar(45) NOT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `restaurant_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `restaurant_timing`
--

INSERT INTO `restaurant_timing` (`id`, `day`, `opening_time`, `closing_time`, `restaurant_id`) VALUES
(15, 'Sunday', '01:00:00', '23:00:00', 1),
(16, 'Monday', '01:00:00', '23:00:00', 1),
(17, 'Tuesday', '01:00:00', '23:00:00', 1),
(18, 'Wednesday', '01:00:00', '23:00:00', 1),
(19, 'Thursday', '01:00:00', '23:00:00', 1),
(20, 'Friday', '01:00:00', '23:00:00', 1),
(21, 'Saturday', '01:00:00', '23:00:00', 1),
(22, 'Sunday', '01:00:00', '23:00:00', 2),
(23, 'Monday', '01:00:00', '23:00:00', 2),
(24, 'Tuesday', '01:00:00', '23:00:00', 2),
(25, 'Wednesday', '01:00:00', '23:00:00', 2),
(26, 'Thursday', '01:00:00', '23:00:00', 2),
(27, 'Friday', '01:00:00', '23:00:00', 2),
(28, 'Saturday', '01:00:00', '23:00:00', 2),
(29, 'Sunday', '01:00:00', '23:00:00', 3),
(30, 'Monday', '01:00:00', '23:00:00', 3),
(31, 'Tuesday', '01:00:00', '23:00:00', 3),
(32, 'Wednesday', '01:00:00', '23:00:00', 3),
(33, 'Thursday', '01:00:00', '23:00:00', 3),
(34, 'Friday', '01:00:00', '23:00:00', 3),
(35, 'Saturday', '01:00:00', '23:00:00', 3),
(36, 'Sunday', '01:00:00', '23:00:00', 4),
(37, 'Monday', '01:00:00', '23:00:00', 4),
(38, 'Tuesday', '01:00:00', '23:00:00', 4),
(39, 'Wednesday', '01:00:00', '23:00:00', 4),
(40, 'Thursday', '01:00:00', '23:00:00', 4),
(41, 'Friday', '01:00:00', '23:00:00', 4),
(42, 'Saturday', '01:00:00', '23:00:00', 4),
(43, 'Sunday', '01:00:00', '23:00:00', 5),
(44, 'Monday', '01:00:00', '23:00:00', 5),
(45, 'Tuesday', '01:00:00', '23:00:00', 5),
(46, 'Wednesday', '01:00:00', '23:00:00', 5),
(47, 'Thursday', '01:00:00', '23:00:00', 5),
(48, 'Friday', '01:00:00', '23:00:00', 5),
(49, 'Saturday', '01:00:00', '23:00:00', 5);

-- --------------------------------------------------------

--
-- Table structure for table `rider_order`
--

CREATE TABLE `rider_order` (
  `id` int(11) NOT NULL,
  `food_order_id` int(11) NOT NULL,
  `parcel_order_id` int(11) NOT NULL,
  `rider_user_id` int(11) NOT NULL,
  `assign_datetime` datetime NOT NULL,
  `rider_response` int(11) NOT NULL COMMENT '0- waiting,1 - accept, 2- cancel',
  `rider_response_datetime` datetime NOT NULL,
  `user_response` int(11) NOT NULL DEFAULT '1' COMMENT '1 - accept, 2- cancel',
  `user_response_datetime` int(11) NOT NULL,
  `on_the_way_to_pickup` datetime NOT NULL,
  `pickup_datetime` datetime NOT NULL,
  `on_the_way_to_dropoff` datetime NOT NULL,
  `delivered` datetime NOT NULL,
  `notification` int(3) NOT NULL,
  `admin_response` int(11) NOT NULL DEFAULT '1' COMMENT '1 - active, 2- cancel',
  `admin_response_datetime` datetime NOT NULL,
  `map` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `rider_order_multi_stop`
--

CREATE TABLE `rider_order_multi_stop` (
  `id` int(11) NOT NULL,
  `rider_order_id` int(11) NOT NULL,
  `on_the_way_to_dropoff` datetime NOT NULL,
  `delivered` datetime NOT NULL,
  `signature` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ride_section`
--

CREATE TABLE `ride_section` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ride_section`
--

INSERT INTO `ride_section` (`id`, `title`) VALUES
(1, 'Economy');

-- --------------------------------------------------------

--
-- Table structure for table `ride_type`
--

CREATE TABLE `ride_type` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `ride_section_id` int(11) NOT NULL,
  `passenger_capacity` int(11) NOT NULL,
  `base_fare` float NOT NULL,
  `cost_per_minute` float NOT NULL,
  `cost_per_distance` float NOT NULL COMMENT '//mile / km',
  `distance_unit` char(2) NOT NULL,
  `image` varchar(255) NOT NULL,
  `language_id` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ride_type`
--

INSERT INTO `ride_type` (`id`, `name`, `description`, `ride_section_id`, `passenger_capacity`, `base_fare`, `cost_per_minute`, `cost_per_distance`, `distance_unit`, `image`, `language_id`, `created`) VALUES
(1, 'Moto', 'Affordable and quick motorcycle rides', 1, 1, 5, 2, 3, 'K', '', 0, '2022-04-25 14:53:11'),
(2, 'GrabGo', 'Affordable , compact rides with AC', 1, 4, 10, 6, 7, 'K', '', 0, '2022-04-25 14:53:47'),
(3, 'Grab Mini', 'Affordable , compact rides without AC', 1, 3, 7, 4, 5, 'K', '', 0, '2022-04-25 14:54:59');

-- --------------------------------------------------------

--
-- Table structure for table `service_charge`
--

CREATE TABLE `service_charge` (
  `id` int(11) NOT NULL,
  `module` varchar(255) NOT NULL,
  `type` int(11) NOT NULL COMMENT '1- percentage, 2- fixed',
  `value` float NOT NULL COMMENT 'amount',
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `service_charge`
--

INSERT INTO `service_charge` (`id`, `module`, `type`, `value`, `created`) VALUES
(1, 'food_delivery', 2, 10, '2022-09-09 18:26:03'),
(2, 'parcel_delivery', 1, 10, '0000-00-00 00:00:00'),
(3, 'ride_hailing', 1, 15, '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `trip`
--

CREATE TABLE `trip` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `dropoff_location` varchar(255) DEFAULT NULL,
  `pickup_lat` varchar(255) DEFAULT NULL,
  `pickup_long` varchar(255) DEFAULT NULL,
  `dropoff_lat` varchar(255) DEFAULT NULL,
  `dropoff_long` varchar(255) DEFAULT NULL,
  `pickup_datetime` varchar(255) DEFAULT NULL,
  `dropoff_datetime` datetime DEFAULT NULL,
  `completed` int(11) NOT NULL COMMENT '1-complete,2- payment collected',
  `duration` time NOT NULL,
  `initial_waiting_time_price` float NOT NULL,
  `ride_fare` float NOT NULL,
  `trip_fare` float NOT NULL,
  `map` varchar(255) NOT NULL,
  `total` float NOT NULL,
  `created` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `trip_history`
--

CREATE TABLE `trip_history` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `created` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `trip_payment`
--

CREATE TABLE `trip_payment` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `payment_type` varchar(255) NOT NULL,
  `payment_collect_from_wallet` float NOT NULL,
  `wallet_debit` int(11) NOT NULL COMMENT '1-debit,2-credit,0-nothing',
  `debit_credit_amount` float NOT NULL,
  `payment_collect_from_card` float NOT NULL,
  `payment_collect_from_cash` float NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `stripe_charge` varchar(255) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `dob` date NOT NULL,
  `social_id` varchar(255) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `password` varchar(500) NOT NULL,
  `image` varchar(255) NOT NULL,
  `role` varchar(10) NOT NULL,
  `username` varchar(255) NOT NULL,
  `social` varchar(255) NOT NULL,
  `device_token` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1' COMMENT '0-inactive,1=active  2=blocked',
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `online` int(11) NOT NULL,
  `verified` int(11) NOT NULL,
  `auth_token` varchar(255) NOT NULL,
  `version` varchar(255) NOT NULL,
  `device` varchar(255) NOT NULL,
  `ip` varchar(255) NOT NULL,
  `country_id` int(11) NOT NULL,
  `wallet` float NOT NULL COMMENT 'amount in usd',
  `paypal` varchar(255) NOT NULL,
  `ride_hailing` int(11) NOT NULL,
  `rider_fee_food_parcel` float NOT NULL,
  `rider_commission_ride_hailing` float NOT NULL COMMENT 'value in percentage',
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_document`
--

CREATE TABLE `user_document` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `attachment` varchar(255) NOT NULL,
  `status` int(11) NOT NULL COMMENT '0-pending,1-accepted,2-rejected',
  `updated` datetime NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_place`
--

CREATE TABLE `user_place` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location_string` varchar(255) NOT NULL,
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `additonal_address_information` text NOT NULL,
  `flat` varchar(255) NOT NULL,
  `building_name` varchar(255) NOT NULL,
  `instruction` text NOT NULL,
  `address_label` varchar(255) NOT NULL,
  `google_place_id` varchar(255) NOT NULL,
  `language_id` int(11) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_rating`
--

CREATE TABLE `user_rating` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `star` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle`
--

CREATE TABLE `vehicle` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `license_plate` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `ride_type_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `lat` varchar(255) NOT NULL,
  `long` varchar(255) NOT NULL,
  `online` int(11) NOT NULL,
  `available` int(11) NOT NULL DEFAULT '1' COMMENT '1- means available, 2 - means busy',
  `updated` datetime NOT NULL,
  `created` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_type`
--

CREATE TABLE `vehicle_type` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `per_km_mile_charge` float NOT NULL,
  `image` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `withdraw_request`
--

CREATE TABLE `withdraw_request` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` float NOT NULL,
  `status` int(11) NOT NULL COMMENT '0-pending, 1 - approve',
  `updated` datetime NOT NULL,
  `created` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `app_slider`
--
ALTER TABLE `app_slider`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coin_worth`
--
ALTER TABLE `coin_worth`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `country`
--
ALTER TABLE `country`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupon`
--
ALTER TABLE `coupon`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupon_used`
--
ALTER TABLE `coupon_used`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `delivery_address`
--
ALTER TABLE `delivery_address`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `delivery_type`
--
ALTER TABLE `delivery_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driver_rating`
--
ALTER TABLE `driver_rating`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `food_category`
--
ALTER TABLE `food_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `food_order`
--
ALTER TABLE `food_order`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_Order_user1_idx` (`user_id`);

--
-- Indexes for table `food_order_menu_extra_item`
--
ALTER TABLE `food_order_menu_extra_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_menu_extra_item_order_menu_item1_idx` (`order_menu_item_id`);

--
-- Indexes for table `food_order_menu_item`
--
ALTER TABLE `food_order_menu_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_menu_item_Order1_idx` (`order_id`);

--
-- Indexes for table `gift`
--
ALTER TABLE `gift`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gift_send`
--
ALTER TABLE `gift_send`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `good_type`
--
ALTER TABLE `good_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `html_page`
--
ALTER TABLE `html_page`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `language`
--
ALTER TABLE `language`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_session`
--
ALTER TABLE `order_session`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_transaction`
--
ALTER TABLE `order_transaction`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `package_size`
--
ALTER TABLE `package_size`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parcel_order`
--
ALTER TABLE `parcel_order`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `parcel_order_multi_stop`
--
ALTER TABLE `parcel_order_multi_stop`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_card`
--
ALTER TABLE `payment_card`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_Card_user1_idx` (`user_id`);

--
-- Indexes for table `phone_no_verification`
--
ALTER TABLE `phone_no_verification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchase_coin`
--
ALTER TABLE `purchase_coin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `recent_location`
--
ALTER TABLE `recent_location`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `report_reason`
--
ALTER TABLE `report_reason`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `report_user`
--
ALTER TABLE `report_user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant`
--
ALTER TABLE `restaurant`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_restaurant_user1_idx` (`user_id`);

--
-- Indexes for table `restaurant_category`
--
ALTER TABLE `restaurant_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant_favourite`
--
ALTER TABLE `restaurant_favourite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_restaurant_favourite_restaurant1_idx` (`restaurant_id`),
  ADD KEY `fk_restaurant_favourite_user1_idx` (`user_id`);

--
-- Indexes for table `restaurant_menu`
--
ALTER TABLE `restaurant_menu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_hotel_menu_restaurant1_idx` (`restaurant_id`);

--
-- Indexes for table `restaurant_menu_extra_item`
--
ALTER TABLE `restaurant_menu_extra_item`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant_menu_extra_section`
--
ALTER TABLE `restaurant_menu_extra_section`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant_menu_item`
--
ALTER TABLE `restaurant_menu_item`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant_rating`
--
ALTER TABLE `restaurant_rating`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rating_restaurant_user1_idx` (`user_id`),
  ADD KEY `fk_rating_restaurant_restaurant1_idx` (`restaurant_id`);

--
-- Indexes for table `restaurant_request`
--
ALTER TABLE `restaurant_request`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restaurant_timing`
--
ALTER TABLE `restaurant_timing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_hotel_timing_restaurant1_idx` (`restaurant_id`);

--
-- Indexes for table `rider_order`
--
ALTER TABLE `rider_order`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rider_order_multi_stop`
--
ALTER TABLE `rider_order_multi_stop`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ride_section`
--
ALTER TABLE `ride_section`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ride_type`
--
ALTER TABLE `ride_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_charge`
--
ALTER TABLE `service_charge`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trip`
--
ALTER TABLE `trip`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trip_history`
--
ALTER TABLE `trip_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trip_payment`
--
ALTER TABLE `trip_payment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_document`
--
ALTER TABLE `user_document`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_place`
--
ALTER TABLE `user_place`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_rating`
--
ALTER TABLE `user_rating`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicle`
--
ALTER TABLE `vehicle`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicle_type`
--
ALTER TABLE `vehicle_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `withdraw_request`
--
ALTER TABLE `withdraw_request`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `app_slider`
--
ALTER TABLE `app_slider`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `coin_worth`
--
ALTER TABLE `coin_worth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `country`
--
ALTER TABLE `country`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=255;

--
-- AUTO_INCREMENT for table `coupon`
--
ALTER TABLE `coupon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupon_used`
--
ALTER TABLE `coupon_used`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_type`
--
ALTER TABLE `delivery_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driver_rating`
--
ALTER TABLE `driver_rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_category`
--
ALTER TABLE `food_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `food_order`
--
ALTER TABLE `food_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_order_menu_extra_item`
--
ALTER TABLE `food_order_menu_extra_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_order_menu_item`
--
ALTER TABLE `food_order_menu_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gift`
--
ALTER TABLE `gift`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gift_send`
--
ALTER TABLE `gift_send`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `good_type`
--
ALTER TABLE `good_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `html_page`
--
ALTER TABLE `html_page`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `language`
--
ALTER TABLE `language`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_session`
--
ALTER TABLE `order_session`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_transaction`
--
ALTER TABLE `order_transaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `package_size`
--
ALTER TABLE `package_size`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `parcel_order`
--
ALTER TABLE `parcel_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parcel_order_multi_stop`
--
ALTER TABLE `parcel_order_multi_stop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_card`
--
ALTER TABLE `payment_card`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phone_no_verification`
--
ALTER TABLE `phone_no_verification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_coin`
--
ALTER TABLE `purchase_coin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recent_location`
--
ALTER TABLE `recent_location`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_reason`
--
ALTER TABLE `report_reason`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_user`
--
ALTER TABLE `report_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request`
--
ALTER TABLE `request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant`
--
ALTER TABLE `restaurant`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `restaurant_category`
--
ALTER TABLE `restaurant_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `restaurant_favourite`
--
ALTER TABLE `restaurant_favourite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant_menu`
--
ALTER TABLE `restaurant_menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `restaurant_menu_extra_item`
--
ALTER TABLE `restaurant_menu_extra_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `restaurant_menu_extra_section`
--
ALTER TABLE `restaurant_menu_extra_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `restaurant_menu_item`
--
ALTER TABLE `restaurant_menu_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `restaurant_rating`
--
ALTER TABLE `restaurant_rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant_request`
--
ALTER TABLE `restaurant_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant_timing`
--
ALTER TABLE `restaurant_timing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `rider_order`
--
ALTER TABLE `rider_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rider_order_multi_stop`
--
ALTER TABLE `rider_order_multi_stop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ride_section`
--
ALTER TABLE `ride_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ride_type`
--
ALTER TABLE `ride_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `service_charge`
--
ALTER TABLE `service_charge`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `trip`
--
ALTER TABLE `trip`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_history`
--
ALTER TABLE `trip_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_payment`
--
ALTER TABLE `trip_payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_document`
--
ALTER TABLE `user_document`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_place`
--
ALTER TABLE `user_place`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_rating`
--
ALTER TABLE `user_rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle`
--
ALTER TABLE `vehicle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle_type`
--
ALTER TABLE `vehicle_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdraw_request`
--
ALTER TABLE `withdraw_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `food_order_menu_extra_item`
--
ALTER TABLE `food_order_menu_extra_item`
  ADD CONSTRAINT `fk_order_menu_extra_item_order_menu_item1` FOREIGN KEY (`order_menu_item_id`) REFERENCES `food_order_menu_item` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
