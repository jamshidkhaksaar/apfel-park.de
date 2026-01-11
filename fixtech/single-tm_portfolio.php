<?php
/**
 * The Template for displaying Portfolio single posts.
 *
 * Full View - No image and full-width content (without details box)
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header();
?>


<?php
// Start the loop.
while ( have_posts() ) : the_post();
?>

<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
	<main id="main" class="site-main">
		<?php get_template_part( 'template-parts/single-portfolio', themetechmount_portfolio_single_view() ); ?>
	</main><!-- .site-main -->
</div><!-- .content-area -->

<?php endwhile; ?>



<?php
// Left Sidebar
themetechmount_get_left_sidebar();

// Right Sidebar
themetechmount_get_right_sidebar();
?>



<?php get_footer(); ?>
