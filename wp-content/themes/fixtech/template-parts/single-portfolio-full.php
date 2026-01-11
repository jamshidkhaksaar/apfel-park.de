<?php
/*
 *
 *  Single Portfolio - Top image
 *
 */

?>

<div class="tm-pf-single-content-wrapper tm-pf-view-full">
	<div class="tm-pf-single-content-wrapper-innerbox">
		<div class="themetechmount-pf-single-content-area">
			<?php echo themetechmount_portfolio_description(); ?>
		</div><!-- .themetechmount-pf-single-content-area -->
		<div class="tm-social-bottom-wrapper col-md-12 col-lg-12">
			<?php echo themetechmount_social_share_box('portfolio'); /* Social share */ ?>
			<div class="tm-nextprev-bottom-nav">
				<?php echo themetechmount_portfolio_next_prev_btn(); /* Next/Prev button */ ?>
			</div>
		</div>
	</div>
</div>


<?php edit_post_link( esc_attr__( 'Edit', 'fixtech' ), '<footer class="entry-footer"><span class="edit-link">', '</span></footer><!-- .entry-footer -->' ); ?>

