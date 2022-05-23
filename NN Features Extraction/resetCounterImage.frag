//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

layout(binding = 0, r32ui) coherent uniform uimage2D image_counter;
layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint head_s[];};
layout(binding = 7, r32ui) coherent uniform uimage2D pixel_fragment_counter;

void main(){
	imageStore(image_counter,ivec2(gl_FragCoord.xy),uvec4(0U));

	//Reset group counters ADDRESS_MAP of S-Buffer
	for(int i=0;i<COUNTERS;i++){
		head_s[i] = 0U;
	}

	imageStore(pixel_fragment_counter,ivec2(gl_FragCoord.xy),uvec4(0U));
}