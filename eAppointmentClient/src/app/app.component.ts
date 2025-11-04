import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>"
})
export class AppComponent {
  constructor(private toastr: ToastrService) {}
}
