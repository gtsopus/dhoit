//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

layout(binding = 0, r32ui ) readonly  uniform uimage2D  image_counter;
layout(binding = 1, r32ui ) writeonly uniform uimage2D  image_head;
layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint head_s[];};

void setPixelHeadAddress  (		  uint val) {			imageStore	(image_head		, ivec2(gl_FragCoord.xy), uvec4(val, 0U, 0U, 0U) );}
uint getPixelFragCounter  (				  ) { return	imageLoad   (image_counter	, ivec2(gl_FragCoord.xy)).x ;}
uint addSharedHeadAddress (int j, uint val) { return	atomicAdd	(head_s[j], val);}

int hashFunction(ivec2 coords){
	return (coords.x + WIDTH * coords.y)%COUNTERS;
}

void main()
{
	uint counter = getPixelFragCounter();
	if(counter == 0U){
		return;
	}

	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint address = addSharedHeadAddress(hash_id, counter);	
	setPixelHeadAddress (address);
}
