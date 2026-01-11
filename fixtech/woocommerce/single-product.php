<?php
/**
 * The Template for displaying all single products.
 *
 * Override this template by copying it to yourtheme/woocommerce/single-product.php
 *
 * @author 		WooThemes
 * @package 	WooCommerce/Templates
 * @version     1.6.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}


// Getting sidebar position from Theme Options
$sidebar_woocommerce = themetechmount_get_option('sidebar_woocommerce');


$main_container_class = 'col-md-12 col-lg-12 col-xs-12';
if( $sidebar_woocommerce!='no' ){
	$main_container_class = 'col-md-9 col-lg-9 col-xs-12';
}


get_header( 'shop' ); ?>

<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
	<main id="main" class="site-main">

    
		<?php
			/**
			 * woocommerce_before_main_content hook
			 *
			 * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
			 * @hooked woocommerce_breadcrumb - 20
			 */
			do_action( 'woocommerce_before_main_content' );
		?>

		<?php while ( have_posts() ) : the_post(); ?>

			<?php wc_get_template_part( 'content', 'single-product' ); ?>

		<?php endwhile; // end of the loop. ?>

		<?php
			/**
			 * woocommerce_after_main_content hook
			 *
			 * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
			 */
			do_action( 'woocommerce_after_main_content' );
		?>

	
	</main><!-- #main .site-main -->
</div><!-- #primary .content-area -->

<?php
// Left Sidebar
themetechmount_get_left_sidebar();

// Right Sidebar
themetechmount_get_right_sidebar();
?>

<?php get_footer( 'shop' ); ?>
