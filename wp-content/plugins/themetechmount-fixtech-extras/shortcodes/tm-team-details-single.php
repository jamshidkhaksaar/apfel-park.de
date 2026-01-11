<?php
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

// [tm-team-details-single]
// tm-team-details-single
if( !function_exists('themetechmount_sc_team_details_single') ){
function themetechmount_sc_team_details_single( $atts, $content=NULL ){
	
	// Contact heading
	$contact_text = esc_attr__('Contact', 'fixtech');
	$contact_text_to = themetechmount_get_option('team_member_single_contact_text');
	if( $contact_text_to ){
		$contact_text = $contact_text_to;
	}
	
	
	$return = '';
	
	$return .= '
	
		<div class="row">

			<div class="themetechmount-team-member-single-featured-area col-xs-12 col-sm-6 col-md-46 col-lg-6">
			
				<div class="themetechmount-team-img">
					' . themetechmount_get_featured_media() . '
					' . themetechmount_box_team_social_links() . '
				</div>
			

			

				
			</div><!-- .themetechmount-team-member-single-featured-area -->
			
			
			
			<div class="themetechmount-team-member-single-content-area col-xs-12 col-sm-6 col-md-6 col-lg-6">
				
				<div class="tm-team-member-single-list row">
					<div class="tm-team-member-single-title-wrapper col-xs-12 col-sm-12 col-md-12 col-lg-12">
						<h2 class="tm-team-member-single-title">'. get_the_title() . '</h2>
						' . themetechmount_team_member_single_meta( 'position' ) . '						

						' . themetechmount_team_member_extra_details() . '

						<h2 class="tm-team-member-single-title">'. esc_attr( $contact_text ) .'</h2>
						' . themetechmount_team_member_meta_details() . '
						
					</div>			
				</div><!-- .tm-team-member-single-list.row -->
				
			</div><!-- .themetechmount-team-member-single-content-area -->
			
		</div>';
		
	
	return $return;
	
}
}
add_shortcode( 'tm-team-details-single', 'themetechmount_sc_team_details_single' );