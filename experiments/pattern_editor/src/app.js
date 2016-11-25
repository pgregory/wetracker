import 'babel-polyfill';
import $ from 'jquery';
import PatternEditor from './pattern_editor';

const PE = new PatternEditor();
PE.render($('#container'));
