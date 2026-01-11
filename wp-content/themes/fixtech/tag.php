<?php
/**
 * The template for displaying Tag pages
 *
 * Used to display archive-type pages for posts in a tag.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header(); ?>

	<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">
		
		
		<?php if( themetechmount_get_option('blog_view') == 'box' ) : ?>
			<div class="row multi-column-row">
		<?php endif; ?>
	

		<?php if ( have_posts() ) : ?>

			<?php
			
			$box               = 'blog';
			$global_view       = themetechmount_get_option('blog_view');  // classic or box
			$global_box_column = themetechmount_get_option('blogbox_column');  // one, two, three etc
			$global_box_view   = themetechmount_get_option('blogbox_view');  // top-image, left-image etc
			
			if( $global_view == 'box' ){
				echo '<div class="row multi-columns-row themetechmount-boxes-row-wrapper">';
			}
			
			// Start the Loop.
			while ( have_posts() ) : the_post();

					if( $global_view == 'box' ){
						echo themetechmount_column_div( 'start', $global_box_column );
							echo get_template_part( 'template-parts/' . $box . 'box/' . $box . 'box', $global_box_view );
						echo themetechmount_column_div( 'end', $global_box_column );
					}
					else if($global_view == 'classic') {
						echo get_template_part('template-parts/blogbox/blogbox','classic');
					}
					else if($global_view == 'classic-style2') {
						echo get_template_part('template-parts/blogbox/blogbox','classic-style2');
					}
					else if($global_view == 'classic-style3') {
						echo get_template_part('template-parts/blogbox/blogbox','classic-style3');
					}
					else {
						get_template_part( 'template-parts/content', 'post' );
					}

			// End the loop.
			endwhile;
			
			if( $global_view == 'box' ){
				echo '</div>';
			}
			?>

		<?php else : ?>
		
			<?php
			// If no content, include the "No posts found" template.
			get_template_part( 'template-parts/content', 'none' );
			?>

		<?php endif; ?>

		
		<?php if( themetechmount_get_option('blog_view') == 'box' ) : ?>
			</div><!-- .row -->
		<?php endif; ?>
		
		
		<?php
		// Previous/next page navigation.
		echo themetechmount_pagination();
		?>
		
		
		</main><!-- .site-main -->
	</div><!-- .content-area -->
	
	
	<?php
	// Left Sidebar
	themetechmount_get_left_sidebar();

	// Right Sidebar
	themetechmount_get_right_sidebar();
	?>
	

<?php get_footer(); ?>
