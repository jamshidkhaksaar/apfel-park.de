<!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="SKYPE_TOOLBAR" content="SKYPE_TOOLBAR_PARSER_COMPATIBLE" />
	<link rel="profile" href="http://gmpg.org/xfn/11">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php if ( is_singular() && pings_open( get_queried_object() ) ) : ?>
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
	<?php endif; ?>
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

<?php
// We are not escaping / sanitizing as we are expecting any (CSS/JS/HTML) code. 
themetechmount_body_start_code();

// correction for The Events Calendar
themetechmount_events_calendar_correction();
?>

<div id="tm-home"></div>
<div class="main-holder">

	<div id="page" class="hfeed site">
	
		<?php get_template_part( 'template-parts/header/headerstyle', esc_attr(themetechmount_get_headerstyle()) ); ?>
		
		<div id="content-wrapper" class="site-content-wrapper">
			<div id="content" class="site-content <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('container')); ?>">
				<div id="content-inner" class="site-content-inner <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('row')); ?>">
			