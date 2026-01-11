<?php
/**
 * Service Category
 *
 */


// Fetching Taxonomy data so we can use it
$tax = $wp_query->get_queried_object();


get_header(); ?>

	<section id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">

		<?php if ( have_posts() ) : ?>
		
			
			<?php
			// Taxonomy featured image set by ThemeStek
			$term_data         = get_term_meta( $tax->term_id, 'tm_taxonomy_options', true );
			$featured_img_code = '';
			if( !empty($term_data['tax_featured_image']) ){
				$featured_img_code = '<div class="tm-term-featured-img"><img src="' . esc_url($term_data['tax_featured_image']) . '" alt="' . esc_attr($tax->name) . '" /></div>';
			}
			echo themetechmount_wp_kses($featured_img_code);
			?>
			
			<?php
			// category description
			$tax_desc = '';
			if( !empty($tax->description) ){
				$tax_desc .= '<div class="tm-term-desc">';
					$tax_desc .= do_shortcode(nl2br($tax->description));
				$tax_desc .= '</div>';
			}
			echo themetechmount_wp_kses($tax_desc);
			?>
			

			<?php
			global $fixtech_theme_options;
			$view   = ( !empty($fixtech_theme_options['services_cat_view']) ) ? $fixtech_theme_options['services_cat_view'] : 'top-image' ;
			$column = ( !empty($fixtech_theme_options['services_cat_column']) ) ? $fixtech_theme_options['services_cat_column'] : 'three' ;
			
			?>	
			
			
			
			<div class="row multi-columns-row themetechmount-boxes-row-wrapper">
				
			<?php
			// Start the Loop.
			while ( have_posts() ) : the_post();
				?>
				
				<?php echo themetechmount_column_div('start', $column ); ?>
					<?php echo get_template_part( 'template-parts/servicebox/servicebox', $view ); ?>
				<?php echo themetechmount_column_div('end', $column ); ?>

				<?php
			// End the loop.
			endwhile;
			
			?>
			
			</div><!-- .themetechmount-boxes-row-wrapper -->
			
			
			<?php
			// Previous/next page navigation.
			echo themetechmount_pagination();
			?>

			
			<?php
		// If no content, include the "No posts found" template.
		else :
			get_template_part( 'template-parts/content', 'none' );

		endif;
		?>

		</main><!-- .site-main -->
	</section><!-- .content-area -->

	
<?php
// Left Sidebar
themetechmount_get_left_sidebar();

// Right Sidebar
themetechmount_get_right_sidebar();
?>
	
	
	
	
<?php get_footer(); ?>
