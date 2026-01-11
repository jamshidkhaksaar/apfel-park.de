<?php
/**
 * The template for displaying image attachments
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

get_header(); ?>

	<div id="primary" class="content-area <?php echo themetechmount_sanitize_html_classes(themetechmount_sidebar_class('content-area')); ?>">
		<main id="main" class="site-main">

			<?php
				// Start the loop.
				while ( have_posts() ) : the_post();
			?>

				<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
								
				<header class="entry-header">
					<?php if ( !is_single() ) : ?>
						<h1 class="entry-title"><?php the_title(); ?></h1>
					<?php endif; // !is_single() ?>
					
					<div class="entry-meta">
						<?php
							$published_text = wp_kses( /* HTML Filter */
								__('<span class="attachment-meta">Published on <time class="entry-date" datetime="%1$s">%2$s</time> in <a href="%3$s" title="Return to %4$s" rel="gallery">%5$s</a></span>', 'fixtech'),
								array(
									'span' => array(
										'class' => array(),
									),
									'time' => array(
										'class'    => array(),
										'datetime' => array(),
									),
									'a' => array(
										'href'  => array(),
										'title' => array(),
										'rel'   => array(),
									)
								)
							);								
							
							$post_title = get_the_title( $post->post_parent );
							if ( empty( $post_title ) || 0 == $post->post_parent )
								$published_text = '<span class="attachment-meta"><time class="entry-date" datetime="%1$s">%2$s</time></span>';

							printf( 
								wp_kses(
									$published_text,
									array(
										'span' => array(
											'class' => array(),
										),
										'time' => array(
											'class' => array(),
											'datetime' => array(),
										),
										'a' => array(
											'href'  => array(),
											'title' => array(),
											'rel'   => array(),
										),
									)
								),
								esc_attr( get_the_date( 'c' ) ),
								get_the_date(),
								esc_url( get_permalink( $post->post_parent ) ),
								esc_attr( strip_tags( $post_title ) ),
								$post_title
							);

							$metadata = wp_get_attachment_metadata();
							printf(
								themetechmount_wp_kses( '<span class="attachment-meta full-size-link"><a href="%1$s" title="%2$s">%3$s (%4$s &times; %5$s)</a></span>' ),
								esc_url( wp_get_attachment_url() ),
								esc_attr__( 'Link to full-size image', 'fixtech' ),
								esc_attr__( 'Full resolution', 'fixtech' ),
								$metadata['width'],
								$metadata['height']
							);
	
						?>
					</div><!-- .entry-meta -->
				</header><!-- .entry-header -->				
					<nav id="image-navigation" class="navigation image-navigation">
						<div class="nav-links">
							<div class="nav-previous"><?php previous_image_link( false, '<i class="tm-fixtech-icon-arrow-left"></i>' . esc_attr__( 'Previous Image', 'fixtech' ) ); ?></div>
							<div class="nav-next"><?php next_image_link( false, esc_attr__( 'Next Image', 'fixtech' ) . '<i class="tm-fixtech-icon-arrow-right"></i>' ); ?></div>
						</div><!-- .nav-links -->
					</nav><!-- .image-navigation -->

					<div class="entry-content">

						<div class="entry-attachment">
							<?php
								/**
								 * Filter the default Fixtech image attachment size.
								 *
								 * @since Fixtech 1.0
								 *
								 * @param string $image_size Image size. Default 'large'.
								 */
								$image_size = apply_filters( 'fixtech_attachment_size', 'large' );

								echo wp_get_attachment_image( get_the_ID(), $image_size );
							?>

							<?php if ( has_excerpt() ) : ?>
								<div class="entry-caption">
									<?php the_excerpt(); ?>
								</div><!-- .entry-caption -->
							<?php endif; ?>

						</div><!-- .entry-attachment -->

						<?php
							the_content();
							wp_link_pages( array(
								'before'      => '<div class="page-links"><span class="page-links-title">' . esc_attr__( 'Pages:', 'fixtech' ) . '</span>',
								'after'       => '</div>',
								'link_before' => '<span>',
								'link_after'  => '</span>',
								'pagelink'    => '<span class="screen-reader-text">' . esc_attr__( 'Page', 'fixtech' ) . ' </span>%',
								'separator'   => '<span class="screen-reader-text">, </span>',
							) );
						?>
					</div><!-- .entry-content -->
				</article><!-- #post-## -->

				<?php
					
					// Edit link
					edit_post_link( esc_attr__( 'Edit', 'fixtech' ), '<span class="edit-link">', '</span>' );
				
					// If comments are open or we have at least one comment, load up the comment template
					if ( comments_open() || get_comments_number() ) :
						comments_template();
					endif;

				// End the loop.
				endwhile;
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