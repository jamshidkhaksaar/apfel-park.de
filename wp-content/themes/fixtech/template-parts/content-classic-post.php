<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class( themetechmount_sanitize_html_classes(themetechmount_postlayout_class()) ); ?> >
	
	<div class="tm-featured-outer-wrapper tm-post-featured-outer-wrapper">
		<?php echo themetechmount_get_featured_media(); // Featured content ?>
	</div>
	
	<div class="tm-blog-classic-box-content">
		<?php
		if( 'quote' != get_post_format() && 'link' != get_post_format() ) : ?>
			<div class="tm-classic-post-meta">
				<?php echo fixtech_entry_meta('blogclassic');  // blog post meta details ?>
			</div>
		<?php endif; ?>
	
		<?php if( !is_single() ) : ?>
		<header class="entry-header">
				<?php if( 'aside' != get_post_format() && 'quote' != get_post_format() && 'link' != get_post_format() ) : ?>
					<?php the_title( sprintf( '<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
				<?php endif; ?>
		</header><!-- .entry-header -->
		<?php endif; ?>	
	<?php if( 'quote' != get_post_format() ) : ?>
		<div class="entry-content">
			
			<?php if( !is_single() ) : ?>
				<div class="themetechmount-box-desc-text"><?php echo themetechmount_blogbox_description(); ?></div>
			<?php endif; ?>
		
			<?php

			the_content( sprintf(
				esc_attr__( 'Read More %s', 'fixtech' ),
				the_title( '<span class="screen-reader-text">', '</span>', false )
			) );

			?>

				<div class="themetechmount-blogbox-footer-readmore">
					<?php echo themetechmount_blogbox_readmore(); ?>
				</div>	
			<?php
			// pagination if any
			wp_link_pages( array(
				'before'      => '<div class="page-links">' . esc_attr__( 'Pages:', 'fixtech' ),
				'after'       => '</div>',
				'link_before' => '<span class="page-number">',
				'link_after'  => '</span>',
			) );
			?>
		</div><!-- .entry-content -->
	
	<?php endif; ?>
	
		<?php
		if( is_single() ){
			echo themetechmount_social_share_box('post');
		}
		?>
		
	<?php
	$prev_post = get_previous_post();  // Prev post
	$next_post = get_next_post();  // Next post
	if( ( !empty($prev_post) || !empty($next_post) ) && shortcode_exists('tm-btn') ){
		?>
		<div class="tm-post-prev-next-buttons clearfix">
			<?php
			if( !empty( $prev_post ) ){
				echo do_shortcode('[tm-btn title="' . esc_attr__('Previous', 'fixtech') . '" style="flat" shape="square" color="skincolor" size="sm" i_align="left" i_icon_themify="tm-fixtech-icon-angle-double-left" add_icon="true" link="url:' . urlencode(esc_url( get_permalink( $prev_post->ID ) )) . '|title:' . rawurlencode($prev_post->post_title) . '||" el_class="tm-left-align-btn"]');
			};
			// Next post
			if ( !empty($next_post) ){
				echo do_shortcode('[tm-btn title="' . esc_attr__('Next', 'fixtech') . '" style="flat" shape="square" color="skincolor" size="sm" i_align="right" i_icon_themify="tm-fixtech-icon-angle-double-right" add_icon="true" link="url:' . urlencode(esc_url( get_permalink( $next_post->ID ) )) . '|title:' . rawurlencode($next_post->post_title) . '||" el_class="tm-right-align-btn"]');
			};
			?>
		</div>
		<?php
	}
	?>
	
	<?php
	// Author bio.
	if ( is_single() && get_the_author_meta( 'description' ) ) :
		get_template_part( 'template-parts/author-bio', 'customized' );
	endif;
	?>
	
	
	<?php
	// If comments are open or we have at least one comment, load up the comment template.
	if ( is_single() && ( comments_open() || get_comments_number() ) ) : ?>
		<div class="tm-blog-classic-box-comment">
			<?php comments_template(); ?>
		</div><!-- .tm-blog-classic-box-comment -->
	<?php endif; ?>
	
	
	</div>
</article><!-- #post-## -->