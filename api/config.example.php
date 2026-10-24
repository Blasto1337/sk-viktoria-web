<?php
// Vzor. Skutečný api/config.php vytváří GitHub Actions při nasazení
// (viz .github/workflows/deploy.yml) a do gitu nepatří.
return [
    'site'      => 'viktoria-tabor.cz',
    'admin_url' => 'https://viktoria-tabor.cz/admin/',
    'origins'   => ['https://viktoria-tabor.cz', 'https://www.viktoria-tabor.cz'],
    'from'      => 'info@viktoria-tabor.cz',
    'from_name' => 'Web SK Viktoria Tábor',
    'to'        => ['info@viktoria-tabor.cz'],
    'smtp'      => [
        'host'   => 'smtp.seznam.cz',
        'port'   => 465,
        'secure' => 'ssl',          // ssl (465) | tls (587, STARTTLS)
        'user'   => 'info@viktoria-tabor.cz',
        'pass'   => 'HESLO',
    ],
];
