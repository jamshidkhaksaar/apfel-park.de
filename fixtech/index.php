<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * e.g., it puts together the home page when no home.php file exists.
 *
 * Learn more: {@link https://codex.wordpress.org/Template_Hierarchy}
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header(); ?>

	<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">
		
		
		<?php if( themetechmount_get_option('blog_view') == 'box' ) : ?>
			<div class="row multi-column-row themetechmount-boxes-row-wrapper">
		<?php endif; ?>
		
		
		<?php if ( have_posts() ) : ?>

			<?php
			// Start the loop.
			while ( have_posts() ) : the_post();

				if( themetechmount_get_option('blog_view') == 'box' /* && !is_home() */ ){
					echo themetechmount_column_div('start', themetechmount_get_option('blogbox_column') );
					echo get_template_part('template-parts/blogbox/blogbox', themetechmount_get_option('blogbox_view') );
					echo themetechmount_column_div('end', themetechmount_get_option('blogbox_column') );
				} 
				else if(themetechmount_get_option('blog_view') == 'classic') {
					echo get_template_part('template-parts/blogbox/blogbox','classic');
				}
				else if(themetechmount_get_option('blog_view') == 'classic-style2') {
					echo get_template_part('template-parts/blogbox/blogbox','classic-style2');
				}
				else if(themetechmount_get_option('blog_view') == 'classic-style3') {
					echo get_template_part('template-parts/blogbox/blogbox','classic-style3');
				}
				else {
					get_template_part( 'template-parts/content', 'post' );
				}

			// End the loop.
			endwhile;

			
		// If no content, include the "No posts found" template.
		else :
			get_template_part( 'template-parts/content', 'none' );

		endif;
		?>
		
		
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
