declare module 'react-native-youtube-iframe' {
    import React from 'react';
    import { ViewStyle } from 'react-native';

    interface YoutubePlayerProps {
        height: number;
        play: boolean;
        videoId: string;
        onChangeState?: (state: string) => void;
        onError?: (error: string) => void;
        onReady?: () => void;
        webViewStyle?: ViewStyle;
    }

    const YoutubePlayer: React.FC<YoutubePlayerProps>;
    export default YoutubePlayer;
}
