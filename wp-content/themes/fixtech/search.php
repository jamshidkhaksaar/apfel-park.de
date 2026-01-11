<?php
/**
 * The template for displaying search results pages.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header(); ?>

	<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">
		
			<?php echo themetechmount_search_form(); ?>
						
			<?php if ( have_posts() ) : ?>
		
				

				<?php if( !empty($_GET['post_type']) ) : ?>
					<header class="page-header">
						<?php echo themetechmount_search_results_box_title( $_GET['post_type'] ); ?>
					</header><!-- .page-header -->
				<?php endif; ?>

				
				<?php echo themetechmount_search_results_content(); ?>

				
				
			<?php
			// If no content, include the "No posts found" template.
			else :
				?>
				
				<div class="tm-sresults-no-content-w">
				
				<?php
				$no_result_text = themetechmount_get_option( 'searchnoresult' );
				echo themetechmount_wp_kses( $no_result_text );
				?>
				
				</div>
				
			<?php endif; ?>

		</main><!-- .site-main -->
	</div><!-- .content-area -->
	
	
	<?php
	// Left Sidebar
	themetechmount_get_left_sidebar();

	// Right Sidebar
	themetechmount_get_right_sidebar();
	?>

<?php get_footer(); ?>
