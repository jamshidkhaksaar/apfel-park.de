<?php
/**
 * Default Events Template
 * This file is the basic wrapper template for all the views if 'Default Events Template'
 * is selected in Events -> Settings -> Template -> Events Template.
 *
 * Override this template in your own theme by creating a file at [your-theme]/tribe-events/default-template.php
 *
 * @package TribeEventsCalendar
 *
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

get_header(); 
?>

<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
	<main id="main" class="site-main">

	<div id="tribe-events-pg-template">
		<?php tribe_events_before_html(); ?>
		<?php tribe_get_view(); ?>
		<?php tribe_events_after_html(); ?>
	</div> <!-- #tribe-events-pg-template -->
</div>

	
<?php
// Left Sidebar
themetechmount_get_left_sidebar();

// Right Sidebar
themetechmount_get_right_sidebar();
?>
	
	
<?php get_footer(); ?>