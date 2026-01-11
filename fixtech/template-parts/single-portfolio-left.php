<?php
/*
 *
 *  Single Portfolio - Left
 *
 */

?>

<div class="tm-pf-single-content-wrapper tm-pf-view-left-image">
	<div class="tm-pf-single-content-wrapper-innerbox">
		<div class="row">
			<div class="tm-pf-detail-box">
				<div class="themetechmount-pf-single-featured-area col-xs-12 col-sm-8 col-md-8 col-lg-8">
					<?php echo themetechmount_get_featured_media(); ?>
				</div><!-- .themetechmount-pf-single-featured-area -->
				
				<div class="themetechmount-pf-single-content-area col-xs-12 col-sm-4 col-md-4 col-lg-4">
					<div class="themetechmount-pf-single-detail-box">
						<?php echo themetechmount_portfolio_description_title(); ?>
						<?php echo themetechmount_portfolio_detailsbox(); ?>
					</div>
				</div><!-- .themetechmount-pf-single-content-area -->
			</div>
			<div class="tm-pf-single-content-area">	
				<?php echo themetechmount_portfolio_description(); ?>
			</div>
			<div class="tm-social-bottom-wrapper col-md-12 col-lg-12">
				<?php echo themetechmount_social_share_box('portfolio'); /* Social share */ ?>
				<div class="tm-nextprev-bottom-nav">
					<?php echo themetechmount_portfolio_next_prev_btn(); /* Next/Prev button */ ?>
				</div>
			</div>
		</div>
	</div>	
	
	<?php echo themetechmount_portfolio_related(); ?>
		
	
</div>

<?php edit_post_link( esc_attr__( 'Edit', 'fixtech' ), '<footer class="entry-footer"><span class="edit-link">', '</span></footer><!-- .entry-footer -->' ); ?>
