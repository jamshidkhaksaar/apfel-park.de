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



<?php if ( is_active_sidebar( 'floating-widgets-bottom' ) ) : ?>
	<div id="floatingbar-widgets-bottom" class="floatingbar-widgets-bottom">
		<div class="floatingbar-widgets-bottom-inner">
			<?php dynamic_sidebar( 'floating-widgets-bottom' ); ?>
		</div><!-- .floatingbar-widgets-bottom-inner -->
	</div><!-- #floatingbar-widgets-bottom -->			
<?php endif; ?>


