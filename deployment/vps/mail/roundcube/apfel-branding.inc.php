<?php

$public_base = 'https://mail.apfel-park.de';

$config['product_name'] = 'Apfel Park Mail';
$config['support_url'] = 'https://www.apfel-park.de';
$config['display_product_info'] = 1;
$config['imap_host'] = 'ssl://mailserver:993';
$config['smtp_host'] = 'ssl://mailserver:465';

$config['imap_conn_options'] = [
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => 'mail.apfel-park.de',
        'allow_self_signed' => false,
    ],
];

$config['smtp_conn_options'] = [
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => 'mail.apfel-park.de',
        'allow_self_signed' => false,
    ],
];

$config['skin_logo'] = [
    'elastic:login' => $public_base . '/apfel-branding/logo-white.png',
    'elastic:login[small]' => $public_base . '/apfel-branding/logo-white.png',
    'elastic:login[link]' => 'https://www.apfel-park.de',
    '[favicon]' => $public_base . '/apfel-branding/favicon.png',
];
