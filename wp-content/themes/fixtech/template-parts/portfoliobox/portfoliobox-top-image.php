<article class="themetechmount-box themetechmount-box-portfolio themetechmount-box-view-top-image themetechmount-portfolio-box-view-top-image <?php echo themetechmount_portfoliobox_class(); ?>">
	<div class="themetechmount-post-item">	
		<div class="themetechmount-post-item-inner">
			<?php echo themetechmount_get_featured_media( get_the_ID(), 'themetechmount-img-servicebox', true ); ?>
			<div class="themetechmount-box-content themetechmount-overlay">
				<div class="themetechmount-box-content-inner">
					<div class="themetechmount-icon-box themetechmount-media-link"><?php echo themetechmount_portfoliobox_media_link(); ?><a href=" <?php echo get_permalink(); ?>" class="themetechmount_pf_link"><i class="tm-fixtech-icon-link"></i></a></div>	
				</div>			
			</div>
		</div>
		
		<div class="themetechmount-box-bottom-content">					
			<div class="themetechmount-box-category"><?php echo themetechmount_portfolio_category(true); ?></div>	
			<?php echo themetechmount_box_title(); ?>			
		</div>
	</div>
</article>