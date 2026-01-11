<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header(); ?>

	<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">

			<section class="error-404 not-found">
				
				<?php echo themetechmount_404_icon(); ?>
				<?php echo themetechmount_404_heading(); ?>
				<?php echo themetechmount_404_description(); ?>
				
				<?php if( themetechmount_get_option('error404_search')==true ): ?>
				<div class="tm-404-search-form">
					<?php get_search_form(); ?>
				</div><!-- .tm-404-search-form -->
				<?php endif; ?>
				
			</section><!-- .error-404 -->

		</main><!-- .site-main -->
	</div><!-- .content-area -->

<?php get_footer(); ?>
