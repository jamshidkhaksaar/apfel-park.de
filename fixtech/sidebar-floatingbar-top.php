<?php
/**
 * The sidebar containing the footer widget area
 *
 * If no active widgets in this sidebar, hide it completely.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */
?>



<?php if ( is_active_sidebar( 'floating-widgets-top' ) ) : ?>
	<div id="floatingbar-widgets-top" class="floatingbar-widgets-top">
		<div class="floatingbar-widgets-top-inner">
			<?php dynamic_sidebar( 'floating-widgets-top' ); ?>
		</div><!-- .floatingbar-widgets-top-inner -->
	</div><!-- #floatingbar-widgets-top -->			
<?php endif; ?>


