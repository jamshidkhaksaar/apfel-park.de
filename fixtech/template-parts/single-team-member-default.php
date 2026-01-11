<?php
/*
 *
 *  Single Team member - Default
 *
 */

?>

<div class="tm-team-member-single-content-wrapper tm-team-member-view-default">
	<div class="tm-team-member-single-content row">
			<div class="themetechmount-team-member-single-featured-area col-xs-12 col-sm-6 col-md-6 col-lg-6">
				<div class="themetechmount-team-img">
					<?php echo themetechmount_get_featured_media(); ?>					
				</div>
			</div><!-- .themetechmount-team-member-single-featured-area -->
			<div class="themetechmount-team-member-single-content-area col-xs-12 col-sm-6 col-md-6 col-lg-6">
				<div class="tm-team-member-content">
					<div class="tm-team-member-single-list row">				
						<div class="tm-team-member-single-title-wrapper col-xs-12 col-sm-12 col-md-12 col-lg-12">
							<div class="tm-team-data row">
								<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
									<h2 class="tm-team-member-single-title"><?php the_title(); ?></h2>
							<?php echo themetechmount_wp_kses( themetechmount_team_member_single_meta( 'position' ) ); ?>
									<?php echo themetechmount_wp_kses( themetechmount_team_member_meta_details() ); ?>				
									<?php echo themetechmount_team_member_extra_details(); ?>
									<div class="clear clr"></div>
									<?php echo themetechmount_wp_kses( themetechmount_box_team_social_links(), 'box_team_social_links' ); ?>
								</div>
							</div>					
						</div>			
					</div><!-- .tm-team-member-single-list.row -->	
				</div>
			</div><!-- .themetechmount-team-member-single-content-area -->		
	</div>
	<div class="tm-team-member-single-content-wrapper">
		<?php echo themetechmount_team_member_content(); ?>
	</div>
</div>

<?php edit_post_link( esc_attr__( 'Edit', 'fixtech' ), '<footer class="entry-footer"><span class="edit-link">', '</span></footer><!-- .entry-footer -->' ); ?>