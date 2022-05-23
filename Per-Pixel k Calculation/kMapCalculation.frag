//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

layout(binding = 0, r32ui )				uniform uimage2D				image_counter;
layout(binding = 6, r32f )			 	uniform image2D					image_importance;

uniform float total_importance;
uniform float average_k;

float getImportance() { return imageLoad(image_importance,ivec2(gl_FragCoord.xy)).r;}

void main(){
	float importance = getImportance();

	if (importance <= 0.0f){
		return;
	}

	uint counter = uint(imageLoad(image_counter, ivec2(gl_FragCoord.xy)).x);
	//Calculate pixel k value, Sec 3.2.2.
	float k_xy = floor((importance/total_importance)*average_k*WIDTH*HEIGHT);

	if(uint(k_xy) <= counter){
		imageStore(image_counter,ivec2(gl_FragCoord.xy),uvec4(uint(k_xy)));
	}

}